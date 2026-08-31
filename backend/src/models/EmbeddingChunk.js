import mongoose from 'mongoose';

/**
 * EmbeddingChunk — Phase 10
 * Stores vectorized transcript chunks for MongoDB Atlas Vector Search.
 * Each chunk preserves speaker, timestamps, and segmentIds for grounded RAG citations.
 *
 * MongoDB Atlas Vector Search index (create manually in Atlas UI or via CLI):
 * {
 *   "fields": [{
 *     "numDimensions": 768,
 *     "path": "embedding",
 *     "similarity": "cosine",
 *     "type": "vector"
 *   }, {
 *     "path": "contentId",
 *     "type": "filter"
 *   }, {
 *     "path": "userId",
 *     "type": "filter"
 *   }]
 * }
 * Index name: "embedding_vector_index"
 * Collection: embeddingchunks
 */
const embeddingChunkSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      default: null,
      index: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    // Vector embedding — excluded from default queries for performance
    embedding: {
      type: [Number],
      default: undefined,
      select: false
    },
    startTime: {
      type: Number,
      default: 0
    },
    endTime: {
      type: Number,
      default: 0
    },
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      default: null
    },
    speakerLabel: {
      type: String,
      default: 'SPEAKER_00'
    },
    speakerDisplayName: {
      type: String,
      default: 'Speaker 1'
    },
    segmentIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: []
    },
    // Metadata for re-indexing and versioning
    embeddingModel: {
      type: String,
      default: 'heuristic-embedding-v1'
    },
    embeddingVersion: {
      type: String,
      default: 'v1'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.contentId = ret.contentId ? ret.contentId.toString() : null;
        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.transcriptId = ret.transcriptId ? ret.transcriptId.toString() : null;
        ret.speakerId = ret.speakerId ? ret.speakerId.toString() : null;
        delete ret._id;
        delete ret.__v;
        delete ret.embedding; // Never expose raw vectors to clients
        return ret;
      }
    }
  }
);

// Compound unique index to prevent duplicate chunks on re-indexing
embeddingChunkSchema.index(
  { contentId: 1, chunkIndex: 1, embeddingVersion: 1 },
  { unique: true }
);
embeddingChunkSchema.index({ contentId: 1, startTime: 1 });
embeddingChunkSchema.index({ userId: 1, contentId: 1 });

export const EmbeddingChunk = mongoose.model('EmbeddingChunk', embeddingChunkSchema);
