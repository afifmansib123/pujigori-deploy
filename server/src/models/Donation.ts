import mongoose, { Schema } from 'mongoose';
import { IDonation, IDonationModel, PaymentStatus, RewardRedemptionStatus } from '../types';

// Donor Info Schema (for anonymous donations)
const DonorInfoSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Donor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Donor email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (phone: string) => {
        return !phone || /^(\+880|880|0)?1[3-9]\d{8}$/.test(phone);
      },
      message: 'Please provide a valid Bangladeshi phone number'
    }
  }
}, {
  _id: false,
  timestamps: false
});

// Metadata Schema
const MetadataSchema = new Schema({
  ipAddress: {
    type: String,
    validate: {
      validator: (ip: string) => {
        return !ip || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  referrer: {
    type: String,
    maxlength: [200, 'Referrer cannot exceed 200 characters']
  }
}, {
  _id: false,
  timestamps: false
});

// Main Donation Schema
const DonationSchema = new Schema<IDonation>({
  donor: {
    type: String,
    required: function() {
      return !this.isAnonymous;
    },
    index: true,
    validate: {
      validator: function(this: IDonation, donorId: string) {
        return this.isAnonymous || (donorId && donorId.length > 0);
      },
      message: 'Donor ID is required for non-anonymous donations'
    }
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,  // ✅ CHANGED from String
    ref: 'Project',                         // ✅ ADDED reference
    required: [true, 'Project ID is required'],
    index: true
  },
  projectCreator: {  // ✅ NEW FIELD
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [10, 'Minimum donation amount is 10 BDT'],
    max: [1000000, 'Maximum donation amount is 1,000,000 BDT']
  },
  adminFee: {
    type: Number,
    required: [true, 'Admin fee is required'],
    min: [0, 'Admin fee cannot be negative'],
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative'],
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: Object.values(PaymentStatus),
      message: 'Invalid payment status'
    },
    default: PaymentStatus.PENDING,
    index: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    trim: true,
    default: 'sslcommerz'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  bankTransactionId: {
    type: String,
    trim: true,
    index: true
  },
  sessionKey: {
    type: String,
    trim: true,
    index: true
  },
  rewardTier: {
    type: String,
    index: true,
    validate: {
      validator: function(this: IDonation, rewardTierId: string) {
        return !rewardTierId || this.rewardValue > 0;
      },
      message: 'Reward value must be greater than 0 when reward tier is selected'
    }
  },
  rewardValue: {
    type: Number,
    default: 0,
    min: [0, 'Reward value cannot be negative']
  },
  rewardStatus: {
    type: String,
    enum: {
      values: Object.values(RewardRedemptionStatus),
      message: 'Invalid reward redemption status'
    },
    default: RewardRedemptionStatus.PENDING,
    index: true
  },
  qrCodeData: {
    type: String,
    trim: true
  },
  qrCodeUrl: {
    type: String,
    validate: {
      validator: (url: string) => {
        return !url || /^https:\/\//.test(url);
      },
      message: 'QR code URL must be a valid HTTPS URL'
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false,
    index: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  donorInfo: {
    type: DonorInfoSchema,
    required: function() {
      return this.isAnonymous;
    }
  },
  metadata: {
    type: MetadataSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
DonationSchema.index({ project: 1, paymentStatus: 1 });
DonationSchema.index({ donor: 1, paymentStatus: 1 });
DonationSchema.index({ createdAt: -1 });
DonationSchema.index({ paymentStatus: 1, createdAt: -1 });
DonationSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
DonationSchema.index({ bankTransactionId: 1 }, { sparse: true });
DonationSchema.index({ sessionKey: 1 }, { sparse: true });
DonationSchema.index({ rewardTier: 1, rewardStatus: 1 });

// Compound indexes for analytics
DonationSchema.index({ project: 1, createdAt: -1 });
DonationSchema.index({ paymentStatus: 1, amount: -1 });

// Pre-save middleware to calculate admin fee and net amount
DonationSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    this.adminFee = Math.round(this.amount * 0.03); // 3% admin fee
    this.netAmount = this.amount - this.adminFee;
  }
  next();
});

// Pre-save middleware to validate donor info for anonymous donations
DonationSchema.pre('save', function(next) {
  if (this.isAnonymous && !this.donorInfo) {
    return next(new Error('Donor info is required for anonymous donations'));
  }
  
  if (!this.isAnonymous && !this.donor) {
    return next(new Error('Donor ID is required for non-anonymous donations'));
  }
  
  next();
});

// Pre-save middleware to generate transaction ID if not provided
DonationSchema.pre('save', function(next) {
  if (!this.transactionId && this.isNew) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    this.transactionId = `PG_${timestamp}_${random}`.toUpperCase();
  }
  next();
});

// Virtual for donor display name
DonationSchema.virtual('donorDisplayName').get(function() {
  if (this.isAnonymous) {
    return this.donorInfo?.name || 'Anonymous';
  }
  return this.donor; // In real implementation, you'd populate this with user name
});

// Virtual for donation display amount (formatted)
DonationSchema.virtual('displayAmount').get(function() {
  return `৳${(this.amount || 0).toLocaleString('en-BD')}`;
});


// Virtual for admin fee display amount
DonationSchema.virtual('displayAdminFee').get(function() {
  return `৳${(this.adminFee || 0).toLocaleString('en-BD')}`;
});

// Virtual for net amount display
DonationSchema.virtual('displayNetAmount').get(function() {
  return `৳${(this.netAmount || 0).toLocaleString('en-BD')}`;
});

// Instance method to check if donation is successful
DonationSchema.methods.isSuccessful = function(): boolean {
  return this.paymentStatus === PaymentStatus.SUCCESS;
};

// Instance method to check if donation is refundable
DonationSchema.methods.isRefundable = function(): boolean {
  return this.paymentStatus === PaymentStatus.SUCCESS && 
         this.rewardStatus === RewardRedemptionStatus.PENDING;
};

// Instance method to check if reward can be redeemed
DonationSchema.methods.canRedeemReward = function(): boolean {
  return this.paymentStatus === PaymentStatus.SUCCESS && 
         this.rewardValue > 0 && 
         this.rewardStatus === RewardRedemptionStatus.PENDING;
};

// Instance method to mark reward as redeemed
DonationSchema.methods.redeemReward = function() {
  if (!this.canRedeemReward()) {
    throw new Error('Reward cannot be redeemed');
  }
  this.rewardStatus = RewardRedemptionStatus.REDEEMED;
  return this.save();
};

// Static method to find donations by project
DonationSchema.statics.findByProject = function(projectId: string, status?: PaymentStatus) {
  const query: any = { project: projectId };
  if (status) {
    query.paymentStatus = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find successful donations
DonationSchema.statics.findSuccessful = function() {
  return this.find({ paymentStatus: PaymentStatus.SUCCESS });
};

// Static method to calculate total raised for a project
DonationSchema.statics.getTotalRaised = function(projectId: string) {
  return this.aggregate([
    {
      $match: {
        project: projectId,
        paymentStatus: PaymentStatus.SUCCESS
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalAdminFee: { $sum: '$adminFee' },
        donationCount: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get donation statistics
DonationSchema.statics.getStatistics = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = { paymentStatus: PaymentStatus.SUCCESS };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalAdminFee: { $sum: '$adminFee' },
        donationCount: { $sum: 1 },
        averageDonation: { $avg: '$amount' },
        uniqueProjects: { $addToSet: '$project' }
      }
    },
    {
      $addFields: {
        uniqueProjectCount: { $size: '$uniqueProjects' }
      }
    },
    {
      $project: {
        uniqueProjects: 0
      }
    }
  ]);
};

// Static method to find pending rewards
DonationSchema.statics.findPendingRewards = function() {
  return this.find({
    paymentStatus: PaymentStatus.SUCCESS,
    rewardValue: { $gt: 0 },
    rewardStatus: RewardRedemptionStatus.PENDING
  }).sort({ createdAt: -1 });
};

const Donation = mongoose.model<IDonation, IDonationModel>('Donation', DonationSchema);

export default Donation;