import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user ID is required'],
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: [
        'WORKSPACE_INVITE',
        'INVITE_ACCEPTED',
        'COMMENT_REPLY',
        'COMMENT_MENTION',
        'REPORT_COMPLETED',
        'PROCESSING_COMPLETED',
        'PROCESSING_FAILED',
        'ROLE_CHANGED',
        'MEMBER_JOINED'
      ],
      required: [true, 'Notification type is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    resourceType: {
      type: String,
      default: null
    },
    resourceId: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false,
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
        return ret;
      }
    }
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
