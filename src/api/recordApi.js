import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Configurable via ENV
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRecords = async (params) => {
  const response = await api.get('/records', { params });
  return response.data;
};

export const createRecord = async (data) => {
  const response = await api.post('/records', data);
  return response.data;
};

export const updateRecord = async (id, data) => {
  const response = await api.put(`/records/${id}`, data);
  return response.data;
};

export const deleteRecord = async (id) => {
  const response = await api.delete(`/records/${id}`);
  return response.data;
};

export const exportRecords = async (params) => {
    // We use a blob download here
  const response = await api.get('/records/export', { 
    params,
    responseType: 'blob' 
  });
  return response.data;
};

export const importRecords = async (data) => {
  const response = await api.post('/records/import', data);
  return response.data;
};

export default api;
