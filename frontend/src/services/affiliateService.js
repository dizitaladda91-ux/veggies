import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const fetchAffiliateLinks = async () => {
  const res = await api.get(API_ENDPOINTS.AFFILIATES.LINKS);
  return res.data.data;
};

export const createAffiliateLink = async (payload) => {
  const res = await api.post(API_ENDPOINTS.AFFILIATES.LINKS, payload);
  return res.data.data;
};

export const fetchEarnings = async () => {
  const res = await api.get(API_ENDPOINTS.AFFILIATES.EARNINGS);
  return res.data.data;
};

export const fetchDashboardOverview = async () => {
  const res = await api.get(API_ENDPOINTS.DASHBOARD.OVERVIEW);
  return res.data.data;
};
