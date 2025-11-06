import mongoose, { Schema , model } from 'mongoose';
import { IPaymentRequest, PaymentRequestStatus , IPaymentRequestModel } from '../types';


// Bank Details Schema
const BankDetailsSchema = new Schema({
  accountHolder: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true,
    maxlength: [100, 'Account holder name cannot exceed 100 characters']
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
    maxlength: [100, 'Bank name cannot exceed 100 characters']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
    validate: {
      validator: (accountNumber: string) => {
        return /^[0-9]{10,20}$/.test(accountNumber);
      },
      message: 'Account number must be between 10-20 digits'
    }
  },
  routingNumber: {
    type: String,
    required: [true, 'Routing number is required'],
    trim: true,
    validate: {
      validator: (routingNumber: string) => {
        return /^[0-9]{9}$/.test(routingNumber);
      },
      message: 'Routing number must be exactly 9 digits'
    }
  },
  branchName: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  }
}, {
  _id: false,
  timestamps: false
});

// Main Payment Request Schema
const PaymentRequestSchema = new Schema<IPaymentRequest>({
  creator: {
    type: String,
    required: [true, 'Creator ID is required'],
    index: true
  },
  project: {
    type: String,
    required: [true, 'Project ID is required'],
    index: true
  },
  requestedAmount: {
    type: Number,
    required: [true, 'Requested amount is required'],
    min: [100, 'Minimum request amount is 100 BDT'],
    max: [10000000, 'Maximum request amount is 10,000,000 BDT']
  },
  adminFeeDeducted: {
    type: Number,
    required: [true, 'Admin fee deducted is required'],
    min: [0, 'Admin fee cannot be negative'],
    default: function() {
      return Math.round(this.requestedAmount * 0.05); // 5% admin fee
    }
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative'],
    default: function() {
      return this.requestedAmount - this.adminFeeDeducted;
    }
  },
  status: {
    type: String,
    required: [true, 'Payment request status is required'],
    enum: {
      values: Object.values(PaymentRequestStatus),
      message: 'Invalid payment request status'
    },
    default: PaymentRequestStatus.PENDING,
    index: true
  },
  bankDetails: {
    type: BankDetailsSchema,
    required: [true, 'Bank details are required']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  processedBy: {
    type: String,
    index: true,
    validate: {
      validator: function(this: IPaymentRequest, processedBy: string) {
        return this.status === PaymentRequestStatus.PENDING || (processedBy && processedBy.length > 0);
      },
      message: 'Processed by is required when status is not pending'
    }
  },
  processedAt: {
    type: Date,
    validate: {
      validator: function(this: IPaymentRequest, processedAt: Date) {
        return this.status === PaymentRequestStatus.PENDING || processedAt;
      },
      message: 'Processed at is required when status is not pending'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PaymentRequestSchema.index({ creator: 1, status: 1 });
PaymentRequestSchema.index({ project: 1, status: 1 });
PaymentRequestSchema.index({ status: 1, createdAt: -1 });
PaymentRequestSchema.index({ processedBy: 1, processedAt: -1 });
PaymentRequestSchema.index({ createdAt: -1 });

// Compound index for admin queries
PaymentRequestSchema.index({ status: 1, requestedAmount: -1 });

// Pre-save middleware to calculate admin fee and net amount
PaymentRequestSchema.pre('save', function(next) {
  if (this.isModified('requestedAmount')) {
    this.adminFeeDeducted = Math.round(this.requestedAmount * 0.05); // 5% admin fee
    this.netAmount = this.requestedAmount - this.adminFeeDeducted;
  }
  next();
});

// Pre-save middleware to set processedAt when status changes
PaymentRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== PaymentRequestStatus.PENDING) {
    if (!this.processedAt) {
      this.processedAt = new Date();
    }
  }
  next();
});

// Pre-save middleware to validate processed fields
PaymentRequestSchema.pre('save', function(next) {
  if (this.status !== PaymentRequestStatus.PENDING) {
    if (!this.processedBy) {
      return next(new Error('Processed by is required when status is not pending'));
    }
    if (!this.processedAt) {
      this.processedAt = new Date();
    }
  }
  next();
});

// Virtual for display amounts
PaymentRequestSchema.virtual('displayRequestedAmount').get(function() {
  return `৳${this.requestedAmount.toLocaleString('en-BD')}`;
});

PaymentRequestSchema.virtual('displayAdminFee').get(function() {
  return `৳${this.adminFeeDeducted.toLocaleString('en-BD')}`;
});

PaymentRequestSchema.virtual('displayNetAmount').get(function() {
  return `৳${this.netAmount.toLocaleString('en-BD')}`;
});

// Virtual for admin fee percentage
PaymentRequestSchema.virtual('adminFeePercentage').get(function() {
  return this.requestedAmount > 0 ? 
    Math.round((this.adminFeeDeducted / this.requestedAmount) * 100) : 0;
});

// Virtual for processing time
PaymentRequestSchema.virtual('processingDays').get(function() {
  if (!this.processedAt) return null;
  
  const diffTime = this.processedAt.getTime() - this.createdAt.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to check if request can be approved
PaymentRequestSchema.methods.canBeApproved = function(): boolean {
  return this.status === PaymentRequestStatus.PENDING;
};

// Instance method to check if request can be rejected
PaymentRequestSchema.methods.canBeRejected = function(): boolean {
  return this.status === PaymentRequestStatus.PENDING;
};

// Instance method to check if request can be marked as paid
PaymentRequestSchema.methods.canBeMarkedAsPaid = function(): boolean {
  return this.status === PaymentRequestStatus.APPROVED;
};

// Instance method to approve request
PaymentRequestSchema.methods.approve = function(adminId: string, notes?: string) {
  if (!this.canBeApproved()) {
    throw new Error('Payment request cannot be approved');
  }
  
  this.status = PaymentRequestStatus.APPROVED;
  this.processedBy = adminId;
  this.processedAt = new Date();
  
  if (notes) {
    this.adminNotes = notes;
  }
  
  return this.save();
};

// Instance method to reject request
PaymentRequestSchema.methods.reject = function(adminId: string, reason: string) {
  if (!this.canBeRejected()) {
    throw new Error('Payment request cannot be rejected');
  }
  
  this.status = PaymentRequestStatus.REJECTED;
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = reason;
  
  return this.save();
};

// Instance method to mark as paid
PaymentRequestSchema.methods.markAsPaid = function(adminId: string, notes?: string) {
  if (!this.canBeMarkedAsPaid()) {
    throw new Error('Payment request cannot be marked as paid');
  }
  
  this.status = PaymentRequestStatus.PAID;
  this.processedBy = adminId;
  this.processedAt = new Date();
  
  if (notes) {
    this.adminNotes = notes;
  }
  
  return this.save();
};

// Static method to find pending requests
PaymentRequestSchema.statics.findPending = function() {
  return this.find({ status: PaymentRequestStatus.PENDING })
    .sort({ createdAt: 1 }); // Oldest first
};

// Static method to find requests by creator
PaymentRequestSchema.statics.findByCreator = function(creatorId: string) {
  return this.find({ creator: creatorId })
    .sort({ createdAt: -1 });
};

// Static method to find requests by project
PaymentRequestSchema.statics.findByProject = function(projectId: string) {
  return this.find({ project: projectId })
    .sort({ createdAt: -1 });
};

// Static method to get payment request statistics
PaymentRequestSchema.statics.getStatistics = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRequested: { $sum: '$requestedAmount' },
        totalAdminFees: { $sum: '$adminFeeDeducted' },
        totalNetAmount: { $sum: '$netAmount' }
      }
    },
    {
      $group: {
        _id: null,
        byStatus: {
          $push: {
            status: '$_id',
            count: '$count',
            totalRequested: '$totalRequested',
            totalAdminFees: '$totalAdminFees',
            totalNetAmount: '$totalNetAmount'
          }
        },
        totalCount: { $sum: '$count' },
        totalRequested: { $sum: '$totalRequested' },
        totalAdminFees: { $sum: '$totalAdminFees' },
        totalNetAmount: { $sum: '$totalNetAmount' }
      }
    }
  ]);
};

// Static method to calculate total admin fees collected
PaymentRequestSchema.statics.getTotalAdminFees = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {
    status: { $in: [PaymentRequestStatus.APPROVED, PaymentRequestStatus.PAID] }
  };
  
  if (startDate || endDate) {
    matchStage.processedAt = {};
    if (startDate) matchStage.processedAt.$gte = startDate;
    if (endDate) matchStage.processedAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAdminFees: { $sum: '$adminFeeDeducted' },
        totalRequests: { $sum: 1 },
        totalAmountProcessed: { $sum: '$requestedAmount' }
      }
    }
  ]);
};

const PaymentRequest = model<IPaymentRequest, IPaymentRequestModel>('PaymentRequest', PaymentRequestSchema);

export default PaymentRequest;