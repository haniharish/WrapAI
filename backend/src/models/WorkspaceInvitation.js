import mongoose from 'mongoose';

const workspaceInvitationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true
    },
    invitedEmail: {
      type: String,
      required: [true, 'Invited email is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'EDITOR', 'VIEWER'],
      default: 'VIEWER'
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviting user ID is required']
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
      default: 'PENDING',
      index: true
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
        delete ret.tokenHash;
        return ret;
      }
    }
  }
);

workspaceInvitationSchema.index({ workspaceId: 1, invitedEmail: 1, status: 1 });

export const WorkspaceInvitation = mongoose.model('WorkspaceInvitation', workspaceInvitationSchema);
export default WorkspaceInvitation;
