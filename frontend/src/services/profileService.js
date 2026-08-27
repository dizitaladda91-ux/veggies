import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const updateProfile = async (profileData) => {
  const res = await api.put(API_ENDPOINTS.PROFILE.GET_UPDATE, profileData);
  return res.data.data;
};
