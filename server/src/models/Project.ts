import mongoose, { Schema } from 'mongoose';
import { IProject, IRewardTier, IProjectUpdate, ProjectStatus, ProjectCategory } from '../types';

// Reward Tier Schema
const RewardTierSchema = new Schema<IRewardTier>({
  title: {
    type: String,
    required: [true, 'Reward tier title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Reward tier description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  minimumAmount: {
    type: Number,
    required: [true, 'Minimum amount is required'],
    min: [1, 'Minimum amount must be at least 10 BDT']
  },
  maxBackers: {
    type: Number,
    min: [1, 'Max backers must be at least 1'],
    default: null
  },
  currentBackers: {
    type: Number,
    default: 0,
    min: [0, 'Current backers cannot be negative']
  },
  estimatedDelivery: {
    type: Date,
    required: [true, 'Estimated delivery date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  items: [{
    type: String,
    trim: true,
    maxlength: [200, 'Reward item cannot exceed 200 characters']
  }]
}, {
  timestamps: false,
  _id: true
});

// Project Update Schema
const ProjectUpdateSchema = new Schema<IProjectUpdate>({
  title: {
    type: String,
    required: [true, 'Update title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  content: {
    type: String,
    required: [true, 'Update content is required'],
    trim: true
  },
  images: [{
    type: String,
    validate: {
      validator: (url: string) => {
        return /^https:\/\//.test(url);
      },
      message: 'Image URL must be a valid HTTPS URL'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  _id: true
});

// Main Project Schema
const ProjectSchema = new Schema<IProject>({
  creator: {
    type: String,
    required: [true, 'Creator ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Project slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: (slug: string) => {
        return /^[a-z0-9-]+$/.test(slug);
      },
      message: 'Slug can only contain lowercase letters, numbers, and hyphens'
    }
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: {
      values: Object.values(ProjectCategory),
      message: 'Invalid project category'
    },
    index: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1000, 'Target amount must be at least 1000 BDT'],
    max: [10000000, 'Target amount cannot exceed 10,000,000 BDT']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  adminFeeAmount: {
    type: Number,
    default: 0,
    min: [0, 'Admin fee amount cannot be negative']
  },
  backerCount: {
    type: Number,
    default: 0,
    min: [0, 'Backer count cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    index: true,
    validate: {
      validator: function(this: IProject, endDate: Date) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    required: [true, 'Project status is required'],
    enum: {
      values: Object.values(ProjectStatus),
      message: 'Invalid project status'
    },
    default: ProjectStatus.DRAFT,
    index: true
  },
  images: [{
    type: String,
    validate: {
      validator: (url: string) => {
        return /^https:\/\//.test(url);
      },
      message: 'Image URL must be a valid HTTPS URL'
    }
  }],
  videoUrl: {
    type: String,
    validate: {
      validator: (url: string) => {
        return !url || /^https:\/\//.test(url);
      },
      message: 'Video URL must be a valid HTTPS URL'
    }
  },
  location: {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    division: {
      type: String,
      required: [true, 'Division is required'],
      trim: true,
      index: true
    }
  },
  rewardTiers: [RewardTierSchema],
  story: {
    type: String,
    required: [true, 'Project story is required'],
    trim: true,
    minlength: [100, 'Story must be at least 100 characters']
  },
  risks: {
    type: String,
    required: [true, 'Project risks description is required'],
    trim: true,
    minlength: [50, 'Risks description must be at least 50 characters']
  },
  updates: [ProjectUpdateSchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProjectSchema.index({ creator: 1, status: 1 });
ProjectSchema.index({ category: 1, status: 1 });
ProjectSchema.index({ 'location.division': 1, status: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ endDate: 1, status: 1 });
ProjectSchema.index({ currentAmount: -1 });
ProjectSchema.index({ tags: 1 });

// Text index for search functionality
ProjectSchema.index({
  title: 'text',
  shortDescription: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    shortDescription: 5,
    description: 2,
    tags: 1
  }
});

// Virtual for funding progress percentage
ProjectSchema.virtual('fundingProgress').get(function() {
  return this.targetAmount > 0 ? Math.round((this.currentAmount / this.targetAmount) * 100) : 0;
});

// Virtual for days remaining
ProjectSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for project URL
ProjectSchema.virtual('projectUrl').get(function() {
  return `/projects/${this.slug}`;
});

// Pre-save middleware to generate slug if not provided
ProjectSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
  next();
});

// Pre-save middleware to calculate admin fee
ProjectSchema.pre('save', function(next) {
  if (this.isModified('currentAmount')) {
    this.adminFeeAmount = Math.round(this.currentAmount * 0.03); // 3% admin fee
  }
  next();
});

// Pre-save middleware to update project status based on dates and funding
ProjectSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === ProjectStatus.ACTIVE) {
    if (now > this.endDate) {
      this.status = this.currentAmount >= this.targetAmount ? ProjectStatus.FUNDED : ProjectStatus.EXPIRED;
    } else if (this.currentAmount >= this.targetAmount) {
      this.status = ProjectStatus.FUNDED;
    }
  }
  
  next();
});

// Instance method to check if project can receive donations
ProjectSchema.methods.canReceiveDonations = function(): boolean {
  const now = new Date();
  return this.status === ProjectStatus.ACTIVE && 
         now >= this.startDate && 
         now <= this.endDate &&
         this.currentAmount < this.targetAmount &&
         this.isActive;
};

// Instance method to get available reward tiers
ProjectSchema.methods.getAvailableRewardTiers = function() {
  return this.rewardTiers.filter((tier: IRewardTier) => {
    return tier.isActive && 
           (!tier.maxBackers || tier.currentBackers < tier.maxBackers);
  }).sort((a: IRewardTier, b: IRewardTier) => a.minimumAmount - b.minimumAmount);
};

// Static method to find active projects
ProjectSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: ProjectStatus.ACTIVE,
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true
  });
};

// Static method to find trending projects
ProjectSchema.statics.findTrending = function(limit = 10) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return this.find({
    status: ProjectStatus.ACTIVE,
    isActive: true,
    updatedAt: { $gte: sevenDaysAgo }
  })
  .sort({ backerCount: -1, currentAmount: -1, updatedAt: -1 })
  .limit(limit);
};

// Static method to find projects by category
ProjectSchema.statics.findByCategory = function(category: ProjectCategory, limit = 20) {
  return this.find({
    category,
    status: ProjectStatus.ACTIVE,
    isActive: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

const Project = mongoose.model<IProject>('Project', ProjectSchema);

export default Project;