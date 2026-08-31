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
