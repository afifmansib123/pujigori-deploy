import mongoose, { Schema } from 'mongoose';

export interface IUser extends mongoose.Document {
  _id: string;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'user' | 'creator' | 'admin';
  isVerified: boolean;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  cognitoId: {
    type: String,
    required: [true, 'Cognito ID is required'],
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (phone: string) => {
        return !phone || /^(\+880|880|0)?1[3-9]\d{8}$/.test(phone);
      },
      message: 'Please provide a valid Bangladeshi phone number'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'creator', 'admin'],
      message: 'Role must be one of: user, creator, admin'
    },
    default: 'user',
    lowercase: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: true, // Cognito handles verification
    index: true
  },
  avatar: {
    type: String,
    default: '',
    validate: {
      validator: (url: string) => {
        return !url || /^https?:\/\//.test(url);
      },
      message: 'Avatar must be a valid URL'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
UserSchema.index({ cognitoId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ name: 'text', email: 'text' });

// Pre-save middleware to update updatedAt
UserSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

// Instance methods
UserSchema.methods.isAdmin = function(): boolean {
  return this.role === 'admin';
};

UserSchema.methods.isCreator = function(): boolean {
  return this.role === 'creator' || this.role === 'admin';
};

UserSchema.methods.canCreateProjects = function(): boolean {
  return this.role === 'creator' || this.role === 'admin';
};

UserSchema.methods.canAccessAdmin = function(): boolean {
  return this.role === 'admin';
};

// Static methods
UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isVerified: true });
};

UserSchema.statics.findByCognitoId = function(cognitoId: string) {
  return this.findOne({ cognitoId });
};

UserSchema.statics.searchUsers = function(searchTerm: string, limit = 20) {
  return this.find(
    { $text: { $search: searchTerm } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit);
};

// Virtual for display name
UserSchema.virtual('displayName').get(function() {
  return this.name || this.email;
});

// Virtual for avatar URL with fallback
UserSchema.virtual('avatarUrl').get(function() {
  return this.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;