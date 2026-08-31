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
      config.headers.Authorization = `Bearer ${token}`;
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
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshRes.data.data.token;
        localStorage.setItem('wrapai_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
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

export async function mockDelay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApiError(code, message, details = []) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}
