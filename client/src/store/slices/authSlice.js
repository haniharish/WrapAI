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
