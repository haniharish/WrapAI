import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_LOGIN',
        'USER_REGISTER',
        'USER_PASSWORD_CHANGE',
        'CONTENT_CREATED',
        'CONTENT_UPDATED',
        'CONTENT_DELETED',
        'SPEAKER_RENAMED',
        'ACTION_ITEM_UPDATED',
        'REPORT_GENERATED',
        'CHAT_MESSAGE_SENT',
        'ADMIN_USER_STATUS_CHANGE',
        'ADMIN_JOB_RETRY'
      ]
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['USER', 'CONTENT', 'TRANSCRIPT', 'REPORT', 'CHAT', 'JOB', 'SYSTEM']
    },
    resourceId: {
      type: String,
      default: null,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
