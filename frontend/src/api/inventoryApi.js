import API from './api';

export const getInventory = async () => {
  const response = await API.get('/inventory');
  return response.data;
};

export const updateInventory = async (inventoryData) => {
  const response = await API.put('/inventory', inventoryData);
  return response.data;
};
