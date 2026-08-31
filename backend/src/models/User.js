import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: 6,
      select: false // Excluded from query results by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    storageUsedBytes: {
      type: Number,
      default: 0
    },
    storageLimitBytes: {
      type: Number,
      default: 5368709120 // 5 GB default
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: { theme: 'light', emailNotifications: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Instance method to compare plain password with hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
