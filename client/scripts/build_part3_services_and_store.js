// client/scripts/build_part3_services_and_store.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/services/api.js
write('src/services/api.js', `
/**
 * Mock API Gateway Client.
 * In Phase 2, this will be replaced with Axios configured with baseURL and JWT interceptors.
 */
export async function mockDelay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApiResponse(data, message = 'Success', meta = null) {
  return {
    success: true,
    data,
    message,
    meta
  };
}

export function createApiError(code, message, details = []) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}
`);

// 2. src/services/authService.js
write('src/services/authService.js', `
import { mockUsers } from '../mocks/mockUsers.js';
import { mockDelay, createApiResponse } from './api.js';

export const authService = {
  async login(email, password) {
    await mockDelay(400);
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
      id: 'usr_demo',
      fullName: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? 'ADMIN' : 'USER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      joinedAt: new Date().toISOString(),
      storageUsedBytes: 500000000,
      storageLimitBytes: 5368709120,
      contentCount: 4,
      status: 'ACTIVE',
      timezone: 'UTC'
    };
    return createApiResponse({
      user,
      token: 'mock_jwt_token_sample'
    }, 'Authentication successful');
  },

  async register(data) {
    await mockDelay(500);
    const newUser = {
      id: \`usr_\${Date.now()}\`,
      fullName: data.fullName,
      email: data.email,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      joinedAt: new Date().toISOString(),
      storageUsedBytes: 0,
      storageLimitBytes: 5368709120,
      contentCount: 0,
      status: 'ACTIVE',
      timezone: 'UTC'
    };
    return createApiResponse({
      user: newUser,
      token: 'mock_jwt_token_sample'
    }, 'Registration successful');
  },

  async getCurrentUser() {
    await mockDelay(200);
    return createApiResponse(mockUsers[0]);
  },

  async logout() {
    await mockDelay(150);
    return createApiResponse(null, 'Logged out successfully');
  }
};
`);

// 3. src/services/contentService.js
write('src/services/contentService.js', `
import { mockContent } from '../mocks/mockContent.js';
import { mockDelay, createApiResponse, createApiError } from './api.js';

let localContentStore = [...mockContent];

export const contentService = {
  async getContentList({ search = '', type = 'ALL', status = 'ALL', sortBy = 'newest' } = {}) {
    await mockDelay(300);
    let results = [...localContentStore];

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) => c.title.toLowerCase().includes(q) || c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (type !== 'ALL') {
      results = results.filter((c) => c.contentType === type);
    }

    if (status !== 'ALL') {
      results = results.filter((c) => c.processingStatus === status);
    }

    if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'duration') {
      results.sort((a, b) => (b.mediaDurationSeconds || 0) - (a.mediaDurationSeconds || 0));
    }

    return createApiResponse(results, 'Content retrieved successfully', { total: results.length });
  },

  async getContentById(id) {
    await mockDelay(250);
    const item = localContentStore.find((c) => c.id === id);
    if (!item) {
      createApiError('CONTENT_NOT_FOUND', \`Content with ID \${id} was not found\`);
    }
    return createApiResponse(item);
  },

  async uploadContent(payload) {
    await mockDelay(600);
    const newContent = {
      id: \`cnt_\${Date.now()}\`,
      userId: 'usr_01',
      title: payload.title || payload.file?.name || 'Untitled Upload',
      description: payload.description || 'Uploaded media file.',
      contentType: payload.type || 'AUDIO',
      sourceUrl: payload.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      mediaDurationSeconds: 1800, // 30 min estimate
      fileSizeBytes: payload.file?.size || 35000000,
      mimeType: payload.file?.type || 'audio/mp3',
      processingStatus: 'QUEUED',
      processingProgress: 0,
      hasReport: false,
      tags: payload.tags || ['Upload', 'Ingested'],
      speakersCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localContentStore.unshift(newContent);
    return createApiResponse(newContent, 'File uploaded and enqueued for processing');
  },

  async updateContent(id, updates) {
    await mockDelay(250);
    const idx = localContentStore.findIndex((c) => c.id === id);
    if (idx === -1) createApiError('NOT_FOUND', 'Item not found');
    localContentStore[idx] = { ...localContentStore[idx], ...updates, updatedAt: new Date().toISOString() };
    return createApiResponse(localContentStore[idx], 'Content updated successfully');
  },

  async deleteContent(id) {
    await mockDelay(300);
    localContentStore = localContentStore.filter((c) => c.id !== id);
    return createApiResponse({ id }, 'Content removed successfully');
  }
};
`);

// 4. src/services/transcriptService.js
write('src/services/transcriptService.js', `
import { mockTranscripts } from '../mocks/mockTranscripts.js';
import { mockDelay, createApiResponse, createApiError } from './api.js';

let localTranscripts = { ...mockTranscripts };

export const transcriptService = {
  async getTranscript(contentId) {
    await mockDelay(300);
    // Fallback to sample transcript if ID doesn't have custom mock
    const t = localTranscripts[contentId] || localTranscripts['cnt_01'];
    if (!t) createApiError('TRANSCRIPT_NOT_FOUND', 'Transcript not found');
    return createApiResponse(t);
  },

  async updateSpeakerName(contentId, speakerId, newName) {
    await mockDelay(300);
    const tKey = localTranscripts[contentId] ? contentId : 'cnt_01';
    const transcript = localTranscripts[tKey];
    if (!transcript) createApiError('TRANSCRIPT_NOT_FOUND', 'Transcript not found');

    // Update speaker entry
    transcript.speakers = transcript.speakers.map((s) => (s.id === speakerId ? { ...s, name: newName } : s));
    // Update segments
    transcript.segments = transcript.segments.map((seg) =>
      seg.speakerId === speakerId ? { ...seg, speakerName: newName } : seg
    );

    return createApiResponse(transcript, 'Speaker renamed successfully across all segments');
  }
};
`);

// 5. src/services/intelligenceService.js
write('src/services/intelligenceService.js', `
import { mockIntelligence } from '../mocks/mockIntelligence.js';
import { mockDelay, createApiResponse } from './api.js';

let localIntelligence = { ...mockIntelligence };

export const intelligenceService = {
  async getIntelligence(contentId) {
    await mockDelay(250);
    const data = localIntelligence[contentId] || localIntelligence['cnt_01'];
    return createApiResponse(data);
  },

  async updateActionItemStatus(contentId, actionId, newStatus) {
    await mockDelay(200);
    const key = localIntelligence[contentId] ? contentId : 'cnt_01';
    const intel = localIntelligence[key];
    if (intel && intel.actionItems) {
      intel.actionItems = intel.actionItems.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a));
    }
    return createApiResponse(intel.actionItems, 'Action item status updated');
  }
};
`);

// 6. src/services/chatService.js
write('src/services/chatService.js', `
import { mockChatSessions } from '../mocks/mockChat.js';
import { mockDelay, createApiResponse } from './api.js';

let localSessions = { ...mockChatSessions };

export const chatService = {
  async getChatHistory(contentId) {
    await mockDelay(200);
    const history = localSessions[contentId] || localSessions['cnt_01'] || [];
    return createApiResponse(history);
  },

  async askQuestion(contentId, questionText) {
    await mockDelay(800); // Simulate RAG query + LLM generation
    const key = localSessions[contentId] ? contentId : 'cnt_01';
    if (!localSessions[key]) localSessions[key] = [];

    const userMsg = {
      id: \`msg_\${Date.now()}\`,
      sender: 'USER',
      message: questionText,
      timestamp: new Date().toISOString()
    };
    localSessions[key].push(userMsg);

    // Context-sensitive mock responses
    let answerText = 'Based on the discussion, the team aligned on using MongoDB Atlas for vector search and BullMQ with Redis for background task orchestration.';
    let citations = [
      {
        segmentId: 'seg_03',
        speaker: 'Alexandre Dubois',
        timestamp: 93,
        timecode: '00:01:33',
        excerpt: 'We benchmarked 1536-dimensional OpenAI embeddings against Atlas vector indexes with cosine similarity...'
      }
    ];

    if (questionText.toLowerCase().includes('deadline') || questionText.toLowerCase().includes('sarah')) {
      answerText = 'Sarah Jenkins has a deadline of Friday, September 4th to finish the BullMQ worker retry configuration.';
      citations = [
        {
          segmentId: 'seg_09',
          speaker: 'Rahul Sharma',
          timestamp: 581,
          timecode: '00:09:41',
          excerpt: 'Sarah, can you finish the BullMQ worker retry configuration by Friday, September 4th?'
        }
      ];
    }

    const aiMsg = {
      id: \`msg_\${Date.now() + 1}\`,
      sender: 'ASSISTANT',
      message: answerText,
      timestamp: new Date().toISOString(),
      citations
    };
    localSessions[key].push(aiMsg);

    return createApiResponse(aiMsg);
  }
};
`);

// 7. src/services/reportService.js
write('src/services/reportService.js', `
import { mockDelay, createApiResponse } from './api.js';

export const reportService = {
  async getReports() {
    await mockDelay(250);
    return createApiResponse([
      {
        id: 'rep_01',
        contentId: 'cnt_01',
        title: 'Executive Minutes — Q3 Engineering Sync',
        contentTitle: 'Q3 Engineering Sync — Database & Ingestion Architecture',
        type: 'MEETING_MINUTES',
        date: '2026-08-28T11:25:00.000Z',
        status: 'Generated',
        sections: ['Executive Summary', 'Key Decisions', 'Action Items', 'Topics']
      },
      {
        id: 'rep_02',
        contentId: 'cnt_02',
        title: 'Lecture Digest — Distributed Consensus & Raft',
        contentTitle: 'CS-842: Distributed Consensus & Raft Protocols',
        type: 'LECTURE_NOTES',
        date: '2026-08-25T15:20:00.000Z',
        status: 'Generated',
        sections: ['Summary', 'Core Concepts', 'Decisions']
      },
      {
        id: 'rep_03',
        contentId: 'cnt_03',
        title: 'Candidate Evaluation — Sarah Chen',
        contentTitle: 'Staff AI Engineer Candidate Interview — Sarah Chen',
        type: 'INTERVIEW_SUMMARY',
        date: '2026-08-22T16:50:00.000Z',
        status: 'Viewed',
        sections: ['Summary', 'Competencies', 'Highlights']
      }
    ]);
  },

  async generateReport(contentId, config = {}) {
    await mockDelay(1200);
    return createApiResponse({
      id: \`rep_\${Date.now()}\`,
      contentId,
      title: 'Compiled Intelligence Report',
      status: 'Generated',
      downloadUrl: '#'
    }, 'Report compiled successfully');
  }
};
`);

// 8. src/services/processingService.js
write('src/services/processingService.js', `
import { mockProcessingJobs } from '../mocks/mockProcessingJobs.js';
import { mockDelay, createApiResponse } from './api.js';

export const processingService = {
  async getJobStatus(contentId) {
    await mockDelay(200);
    const job = mockProcessingJobs.find((j) => j.contentId === contentId) || mockProcessingJobs[0];
    return createApiResponse(job);
  }
};
`);

// 9. src/services/adminService.js
write('src/services/adminService.js', `
import { mockUsers } from '../mocks/mockUsers.js';
import { mockContent } from '../mocks/mockContent.js';
import { mockProcessingJobs } from '../mocks/mockProcessingJobs.js';
import { mockAnalytics } from '../mocks/mockAnalytics.js';
import { mockDelay, createApiResponse } from './api.js';

export const adminService = {
  async getMetrics() {
    await mockDelay(300);
    return createApiResponse(mockAnalytics.overview);
  },

  async getUsers() {
    await mockDelay(300);
    return createApiResponse(mockUsers);
  },

  async getContentMonitoring() {
    await mockDelay(350);
    return createApiResponse(mockContent);
  },

  async getJobs() {
    await mockDelay(300);
    return createApiResponse(mockProcessingJobs);
  },

  async getAnalytics() {
    await mockDelay(350);
    return createApiResponse(mockAnalytics);
  },

  async getSystemHealth() {
    await mockDelay(250);
    return createApiResponse(mockAnalytics.systemServices);
  }
};
`);

// 10. src/store/slices/authSlice.js
write('src/store/slices/authSlice.js', `
import { createSlice } from '@reduxjs/toolkit';
import { mockUsers } from '../../mocks/mockUsers.js';

const initialState = {
  isAuthenticated: true,
  user: mockUsers[0], // Defaults to Rahul Sharma (USER)
  token: 'mock_token_active',
  role: 'USER' // 'USER' | 'ADMIN'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.role = action.payload.user.role;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
      state.token = null;
    },
    toggleRole: (state) => {
      if (state.role === 'USER') {
        state.role = 'ADMIN';
        state.user = mockUsers[1]; // Sarah Jenkins (ADMIN)
      } else {
        state.role = 'USER';
        state.user = mockUsers[0]; // Rahul Sharma (USER)
      }
    }
  }
});

export const { loginSuccess, logout, toggleRole } = authSlice.actions;
export default authSlice.reducer;
`);

// 11. src/store/slices/uiSlice.js
write('src/store/slices/uiSlice.js', `
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  toasts: [],
  activeModal: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addToast: (state, action) => {
      const id = Date.now();
      state.toasts.push({ id, ...action.payload });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setModal: (state, action) => {
      state.activeModal = action.payload;
    }
  }
});

export const { toggleSidebar, addToast, removeToast, setModal } = uiSlice.actions;
export default uiSlice.reducer;
`);

// 12. src/store/slices/workspaceSlice.js
write('src/store/slices/workspaceSlice.js', `
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeContentId: 'cnt_01',
  currentPlaybackSeconds: 0,
  isPlaying: false,
  activeTab: 'transcript',
  speakerFilter: 'ALL',
  searchQuery: ''
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveContentId: (state, action) => {
      state.activeContentId = action.payload;
    },
    seekPlayback: (state, action) => {
      state.currentPlaybackSeconds = action.payload;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSpeakerFilter: (state, action) => {
      state.speakerFilter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    }
  }
});

export const {
  setActiveContentId,
  seekPlayback,
  setIsPlaying,
  setActiveTab,
  setSpeakerFilter,
  setSearchQuery
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
`);

// 13. src/store/store.js
write('src/store/store.js', `
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import uiReducer from './slices/uiSlice.js';
import workspaceReducer from './slices/workspaceSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    workspace: workspaceReducer
  }
});
`);

console.log('Part 3 services and Redux store generated successfully.');
