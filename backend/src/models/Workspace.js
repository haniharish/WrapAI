import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: ['PERSONAL', 'TEAM'],
      default: 'PERSONAL',
      index: true
    },
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'BUSINESS'],
      default: 'FREE'
    },
    settings: {
      defaultRole: {
        type: String,
        enum: ['VIEWER', 'EDITOR', 'ADMIN'],
        default: 'VIEWER'
      },
      allowMemberInvites: {
        type: Boolean,
        default: true
      },
      maxStorageBytes: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024 // 5 GB default
      },
      maxTranscriptionMinutes: {
        type: Number,
        default: 300 // 5 hours default
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

workspaceSchema.index({ ownerId: 1, type: 1 });
workspaceSchema.index({ slug: 1 }, { sparse: true });

export const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
