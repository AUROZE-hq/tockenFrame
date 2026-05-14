import api from './api';

export const getWhatsAppLogs = (params) => api.get('/whatsapp-logs', { params });
