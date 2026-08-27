import axios from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from '../utils/storage';

// Vite exposes environment variables at build time. Production must use the
// actual deployed backend URL from Vercel; a guessed hostname causes Login and
// Create Account to fail with an unhelpful browser "Network Error".
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    if (!API_BASE_URL) {
      return Promise.reject(new Error('The API is not configured. Set VITE_API_BASE_URL to your deployed backend URL.'));
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (API_BASE_URL) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
          if (res.data.success) {
            const { accessToken } = res.data.data.tokens;
            setAccessToken(accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          clearTokens();
        }
      } else {
        clearTokens();
      }
    }

    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
