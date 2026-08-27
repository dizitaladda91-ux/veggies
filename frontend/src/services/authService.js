import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { setAccessToken, clearTokens } from '../utils/storage';

export const loginUser = async (email, password) => {
  const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  if (res.data.success) {
    const { user, tokens } = res.data.data;
    if (tokens?.accessToken) setAccessToken(tokens.accessToken);
    return res.data.data;
  }
  throw new Error(res.data.message);
};
export const setupMfa = async (mfaToken) => (await api.post('/auth/mfa/setup', { mfaToken })).data.data;
export const enableMfa = async (mfaToken, secret, code) => { const data = (await api.post('/auth/mfa/enable', { mfaToken, secret, code })).data.data; setAccessToken(data.tokens.accessToken); return data.user; };
export const verifyMfaLogin = async (mfaToken, code) => { const data = (await api.post('/auth/mfa/verify-login', { mfaToken, code })).data.data; setAccessToken(data.tokens.accessToken); return data.user; };

export const registerUser = async (formData) => {
  const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, formData);
  if (res.data.success) {
    const { user, tokens } = res.data.data;
    setAccessToken(tokens.accessToken);
    return user;
  }
  throw new Error(res.data.message);
};

export const getCurrentUser = async () => {
  const res = await api.get(API_ENDPOINTS.AUTH.ME);
  return res.data.data.user;
};

export const logoutUser = async () => {
  try {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  } finally {
    clearTokens();
  }
};
