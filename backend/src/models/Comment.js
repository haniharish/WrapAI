import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: [true, 'Content ID is required'],
      index: true
    },
    targetType: {
      type: String,
      enum: ['TRANSCRIPT', 'ANALYSIS', 'REPORT'],
      required: [true, 'Target type is required'],
      index: true
    },
    targetId: {
      type: String,
      default: null,
      index: true
    },
    timestampSeconds: {
      type: Number,
      default: null
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
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

commentSchema.index({ contentId: 1, targetType: 1, createdAt: 1 });
commentSchema.index({ workspaceId: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
