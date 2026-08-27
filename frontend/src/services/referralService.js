import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const trackReferralClick = async (code) => {
  const res = await api.get(API_ENDPOINTS.REFERRALS.CLICK(code));
  return res.data.data;
};

export const fetchTeam = async () => {
  const res = await api.get(API_ENDPOINTS.REFERRALS.TEAM);
  return res.data.data;
};

export const fetchCommissionRules = async () => {
  const res = await api.get(API_ENDPOINTS.COMMISSIONS.RULES);
  return res.data.data;
};

export const createCommissionRule = async (ruleData) => {
  const res = await api.post(API_ENDPOINTS.COMMISSIONS.RULES, ruleData);
  return res.data.data;
};

export const settleMaturedCommissions = async (holdDays = 7) => {
  const res = await api.post('/commissions/auto-settle', { holdDays });
  return res.data.data;
};
