// client/scripts/build_phase4_frontend.js
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
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HttpOnly refresh cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wrapai_token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap response & Auto Refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Unwraps { success, data, message, meta }
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          \`\${API_BASE_URL}/auth/refresh\`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshRes.data.data.token;
        localStorage.setItem('wrapai_token', newToken);
        originalRequest.headers.Authorization = \`Bearer \${newToken}\`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('wrapai_token');
        localStorage.removeItem('wrapai_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.details = error.response?.data?.errors || [];
    return Promise.reject(customError);
  }
);

export function createApiResponse(data, message = 'Success', meta = null) {
  return {
    success: true,
    data,
    message,
    meta
  };
}
`);

// 2. src/services/authService.js
write('src/services/authService.js', `
import { apiClient } from './api.js';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.token) {
      localStorage.setItem('wrapai_token', response.data.token);
      localStorage.setItem('wrapai_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    if (response.data?.token) {
      localStorage.setItem('wrapai_token', response.data.token);
      localStorage.setItem('wrapai_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    if (response.data) {
      localStorage.setItem('wrapai_user', JSON.stringify(response.data));
    }
    return response;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('wrapai_token');
      localStorage.removeItem('wrapai_user');
    }
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    if (response.data?.token) {
      localStorage.setItem('wrapai_token', response.data.token);
      localStorage.setItem('wrapai_user', JSON.stringify(response.data.user));
    }
    return response;
  }
};
`);

// 3. src/services/userService.js
write('src/services/userService.js', `
import { apiClient } from './api.js';

export const userService = {
  async getProfile() {
    return apiClient.get('/users/me');
  },

  async updateProfile(data) {
    const response = await apiClient.patch('/users/me', data);
    if (response.data) {
      localStorage.setItem('wrapai_user', JSON.stringify(response.data));
    }
    return response;
  },

  async changePassword(currentPassword, newPassword) {
    return apiClient.patch('/users/me/password', { currentPassword, newPassword });
  },

  async deleteAccount() {
    return apiClient.delete('/users/me');
  }
};
`);

// 4. src/store/slices/authSlice.js
write('src/store/slices/authSlice.js', `
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
    }
  }
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
`);

// 5. src/pages/auth/LoginPage.jsx
write('src/pages/auth/LoginPage.jsx', `
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice.js';
import { authService } from '../../services/authService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { Mail, Lock, Shield, User, AlertCircle } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: 'rahul@wrapai.io',
      password: 'Password123'
    }
  });

  const onSubmit = async (data) => {
    setAuthError(null);
    try {
      const res = await authService.login(data.email, data.password);
      dispatch(loginSuccess(res.data));
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password');
    }
  };

  const fillDemoUser = () => {
    setValue('email', 'rahul@wrapai.io');
    setValue('password', 'Password123');
    setAuthError(null);
  };

  const fillDemoAdmin = () => {
    setValue('email', 'sarah.jenkins@wrapai.io');
    setValue('password', 'Password123');
    setAuthError(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brand-light">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-brand-navy shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="font-display text-3xl uppercase tracking-wide text-brand-navy">Sign In</span>
            <p className="text-xs text-brand-taupe mt-1">Access your WrapAI intelligence workspace</p>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: emailPattern, message: 'Invalid email address' }
              })}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <Link to="/forgot-password" className="font-bold text-brand-navy hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
              Enter Workspace
            </Button>
          </form>

          {/* Quick Demo Pre-fill helpers */}
          <div className="mt-8 pt-6 border-t border-brand-charcoal/10">
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-taupe text-center mb-3">
              DEMO CREDENTIALS (CLICK TO FILL)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={fillDemoUser} icon={User}>
                User Role
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={fillDemoAdmin} icon={Shield}>
                Admin Role
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-brand-taupe">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-navy hover:underline">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
`);

// 6. src/pages/auth/RegisterPage.jsx
write('src/pages/auth/RegisterPage.jsx', `
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice.js';
import { authService } from '../../services/authService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [regError, setRegError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    setRegError(null);
    try {
      const res = await authService.register(data);
      dispatch(loginSuccess(res.data));
      navigate('/dashboard');
    } catch (err) {
      setRegError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brand-light">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-brand-navy shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="font-display text-3xl uppercase tracking-wide text-brand-navy">Create Account</span>
            <p className="text-xs text-brand-taupe mt-1">Start converting long-form content into clarity</p>
          </div>

          {regError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Rahul Sharma"
              error={errors.fullName?.message}
              {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="rahul@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: emailPattern, message: 'Invalid email address' }
              })}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
            />

            <Button type="submit" variant="primary" size="md" className="w-full mt-4" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-brand-taupe">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-navy hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
`);

// 7. src/pages/user/SettingsPage.jsx
write('src/pages/user/SettingsPage.jsx', `
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService.js';
import { updateUser } from '../../store/slices/authSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { User, Shield, HardDrive, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

export function SettingsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordErr, setPasswordErr] = useState(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      fullName: user?.fullName || 'Rahul Sharma',
      email: user?.email || 'rahul@wrapai.io',
      timezone: user?.timezone || 'UTC+05:30 (India Standard Time)'
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting }
  } = useForm();

  const onProfileSubmit = async (data) => {
    setProfileMsg(null);
    try {
      const res = await userService.updateProfile({
        fullName: data.fullName,
        timezone: data.timezone
      });
      dispatch(updateUser(res.data));
      setProfileMsg('Profile details updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordMsg(null);
    setPasswordErr(null);
    try {
      await userService.changePassword(data.currentPassword, data.newPassword);
      setPasswordMsg('Password changed successfully.');
      resetPasswordForm();
    } catch (err) {
      setPasswordErr(err.message || 'Failed to update password');
    }
  };

  const usedBytes = user?.storageUsedBytes || 1284505600;
  const limitBytes = user?.storageLimitBytes || 5368709120;
  const storagePercent = Math.round((usedBytes / limitBytes) * 100);

  return (
    <div className="max-w-4xl space-y-10">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">WORKSPACE CONFIGURATION</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Account & Settings
        </h1>
      </div>

      {/* 1. Profile Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <User className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Profile Details</h2>
        </div>

        {profileMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('fullName', { required: true })} />
            <Input label="Email Address" type="email" disabled {...register('email')} />
          </div>

          <Select
            label="Timezone"
            {...register('timezone')}
            options={[
              { value: 'UTC+05:30 (India Standard Time)', label: 'UTC+05:30 (India Standard Time)' },
              { value: 'UTC-04:00 (Eastern Time)', label: 'UTC-04:00 (Eastern Time)' },
              { value: 'UTC+00:00 (GMT)', label: 'UTC+00:00 (GMT)' },
              { value: 'UTC+01:00 (Central European Time)', label: 'UTC+01:00 (Central European Time)' }
            ]}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>Save Profile</Button>
          </div>
        </form>
      </Card>

      {/* 2. Storage Quota Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <HardDrive className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Storage & Quota</h2>
        </div>

        <div className="space-y-4">
          <ProgressBar progress={storagePercent} label={\`Storage Used: \${formatBytes(usedBytes)} of \${formatBytes(limitBytes)}\`} />
          <p className="text-xs text-brand-taupe">
            Large audio and video files are preserved in high-durability AWS S3 object storage. Transcripts and vectors are stored in MongoDB Atlas.
          </p>
        </div>
      </Card>

      {/* 3. Security Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <Shield className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Security & Password</h2>
        </div>

        {passwordMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordErr && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordErr}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={passErrors.currentPassword?.message}
              {...registerPassword('currentPassword', { required: 'Current password is required' })}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={passErrors.newPassword?.message}
              {...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="outline" size="sm" isLoading={isPassSubmitting}>Change Password</Button>
          </div>
        </form>
      </Card>

      {/* 4. Danger Zone */}
      <Card className="p-8 border-red-300 bg-red-50/30">
        <div className="flex items-center space-x-3 pb-4 border-b border-red-200 mb-4 text-red-900">
          <Trash2 className="w-5 h-5 text-red-700" />
          <h2 className="font-display text-2xl uppercase tracking-wide">Danger Zone</h2>
        </div>
        <p className="text-xs text-red-800 mb-4">
          Permanently delete your account and all associated audio, video, transcripts, and intelligence reports. This action is irreversible.
        </p>
        <Button variant="danger" size="sm" onClick={() => alert('Account deletion requested.')}>Delete Account</Button>
      </Card>
    </div>
  );
}
`);

console.log('Phase 4 Frontend Client Services & Components Generated.');
