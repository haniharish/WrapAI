import { createSlice } from '@reduxjs/toolkit';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('wrapai_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const token = localStorage.getItem('wrapai_token');
const user = getInitialUser();

const initialState = {
  isAuthenticated: !!token && !!user,
  user: user,
  token: token,
  role: user?.role || 'USER'
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
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (action.payload.role) {
        state.role = action.payload.role;
      }
    },
    toggleRole: (state) => {
      state.role = state.role === 'ADMIN' ? 'USER' : 'ADMIN';
      if (state.user) {
        state.user.role = state.role;
      }
    }
  }
});

export const { loginSuccess, logout, updateUser, toggleRole } = authSlice.actions;
export default authSlice.reducer;
