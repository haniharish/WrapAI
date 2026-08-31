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
