import api from './api';

export const getSmsLogs = (params) => api.get('/sms-logs', { params });
