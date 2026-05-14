import api from './api';

export const createOrder = (data) => api.post('/orders', data);

export const getOrders = (params) => api.get('/orders', { params });

export const getOrderById = (id) => api.get(`/orders/${id}`);

export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);

export const deleteOrder = (id) => api.delete(`/orders/${id}`);

export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);

export const markWorkDone = (id) => api.patch(`/orders/${id}/work-done`);

export const markDeliveryDone = (id) => api.patch(`/orders/${id}/delivery-done`);

export const clearAllOrders = (password) => api.delete('/orders/clear/all', { data: { password } });
