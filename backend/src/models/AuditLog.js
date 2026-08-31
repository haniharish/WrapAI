import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
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
        'CONTENT_RENAMED',
        'CONTENT_DELETED',
        'SPEAKER_RENAMED',
        'ACTION_ITEM_UPDATED',
        'REPORT_GENERATED',
        'REPORT_SHARED',
        'REPORT_DELETED',
        'CHAT_MESSAGE_SENT',
        'ADMIN_USER_STATUS_CHANGE',
        'ADMIN_JOB_RETRY',
        'PROCESSING_JOB_ENQUEUED',
        'PROCESSING_JOB_RETRIED',
        'PROCESSING_JOB_CANCELLED',
        'WORKSPACE_CREATED',
        'WORKSPACE_UPDATED',
        'WORKSPACE_DELETED',
        'MEMBER_INVITED',
        'MEMBER_JOINED',
        'MEMBER_REMOVED',
        'ROLE_CHANGED',
        'COMMENT_CREATED',
        'COMMENT_DELETED'
      ]
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'USER',
        'CONTENT',
        'TRANSCRIPT',
        'REPORT',
        'CHAT',
        'JOB',
        'PROCESSING_JOB',
        'SYSTEM',
        'WORKSPACE',
        'WORKSPACE_MEMBER',
        'WORKSPACE_INVITATION',
        'COMMENT'
      ]
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
auditLogSchema.index({ workspaceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
