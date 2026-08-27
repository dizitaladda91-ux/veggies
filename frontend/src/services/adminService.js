import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const fetchAdminWithdrawals = async (params = {}) => (await api.get('/admin/withdrawals', { params })).data.data;
export const approveWithdrawal = async (id, notes = '') => (await api.patch(`/admin/withdrawals/${id}/approve`, { notes })).data.data;
export const rejectWithdrawal = async (id, notes = '') => (await api.patch(`/admin/withdrawals/${id}/reject`, { notes })).data.data;
export const fetchPayouts = async (params = {}) => (await api.get('/payouts', { params })).data.data;
export const createPayout = async (data) => (await api.post('/payouts', data)).data.data;
export const approvePayout = async (id, notes = '') => (await api.patch(`/payouts/${id}/approve`, { notes })).data.data;
export const updatePayout = async (id, action, data = {}) => (await api.patch(`/payouts/${id}/${action}`, data)).data.data;

export const fetchUsers = async (params) => {
  const res = await api.get(API_ENDPOINTS.ADMIN.USERS, { params });
  return res.data;
};

export const updateUserStatus = async (userId, status) => {
  const res = await api.patch(API_ENDPOINTS.ADMIN.UPDATE_STATUS(userId), { status });
  return res.data;
};

export const deleteUser = async (userId) => {
  const res = await api.delete(API_ENDPOINTS.ADMIN.DELETE_USER(userId));
  return res.data;
};

export const fetchAuditLogs = async (params) => {
  const res = await api.get(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params });
  return res.data?.data || res.data || [];
};

export const exportWithdrawalsCsv = async () => {
  const res = await api.get('/admin/withdrawals/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `withdrawals_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportPayoutsCsv = async () => {
  const res = await api.get('/payouts/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `payouts_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const createRazorpayPayoutOrder = async (withdrawalId) => {
  const res = await api.post(`/admin/withdrawals/${withdrawalId}/razorpay-order`);
  return res.data.data;
};

export const completeRazorpayPayout = async (withdrawalId, paymentId) => {
  const res = await api.post(`/admin/withdrawals/${withdrawalId}/razorpay-complete`, { paymentId });
  return res.data.data;
};
