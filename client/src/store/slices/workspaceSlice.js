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
