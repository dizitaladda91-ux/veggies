import api from './api';

export const fetchMarketingAssets = async () => {
  const res = await api.get('/marketing-assets');
  return res.data.data;
};

export const createMarketingAsset = async (data) => {
  const res = await api.post('/marketing-assets', data);
  return res.data.data;
};

export const deleteMarketingAsset = async (id) => {
  const res = await api.delete(`/marketing-assets/${id}`);
  return res.data.data;
};
