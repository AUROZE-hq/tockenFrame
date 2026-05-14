// Save token and admin info to local storage
export const saveAuth = (token, admin) => {
  localStorage.setItem('token', token);
  localStorage.setItem('admin', JSON.stringify(admin));
};

// Get token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Get admin info
export const getAdmin = () => {
  const adminStr = localStorage.getItem('admin');
  if (!adminStr) return null;
  try {
    return JSON.parse(adminStr);
  } catch (error) {
    return null;
  }
};

// Clear auth data
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('admin');
};

// Check if authenticated
export const isAuthenticated = () => {
  return !!getToken();
};
