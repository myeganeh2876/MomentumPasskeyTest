import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000', // Replace with your actual API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post('/auth/refresh/', {
          refresh: refreshToken,
        });
        
        // Save the new tokens
        localStorage.setItem('accessToken', response.data.access);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Phone login
  requestPhoneVerification: (phone, country) => {
    return api.post('/auth/phone/login/', { phone, country });
  },
  
  verifyPhone: (phone, code, country, deviceId, fcmToken, userAgent) => {
    return api.post('/auth/phone/verify/', {
      phone,
      code,
      country,
      device_id: deviceId,
      fcm_token: fcmToken,
      user_agent: userAgent,
    });
  },
  
  // Passkey authentication
  getPasskeyAuthOptions: (phone) => {
    return api.post('/auth/passkey/authenticate/options/', { phone });
  },
  
  verifyPasskeyAuth: (authResponse) => {
    return api.post('/auth/passkey/authenticate/verify/', authResponse);
  },
  
  // Passkey registration
  getPasskeyRegOptions: (name) => {
    return api.post('/auth/passkey/register/options/', { name });
  },
  
  verifyPasskeyReg: (regResponse) => {
    return api.post('/auth/passkey/register/verify/', regResponse);
  },
  
  // Get passkey credentials
  getPasskeyCredentials: () => {
    return api.get('/auth/passkey/credentials/');
  },
  
  // Delete passkey credential
  deletePasskeyCredential: (credentialId) => {
    return api.delete(`/auth/passkey/credentials/${credentialId}/`);
  },
};

// Devices API
export const devicesAPI = {
  // Get all devices
  getDevices: () => {
    return api.get('/devices/');
  },
  
  // Get device details
  getDeviceDetails: (deviceId) => {
    return api.get(`/devices/${deviceId}/`);
  },
  
  // Update device FCM token
  updateDeviceFCMToken: (deviceId, fcmToken) => {
    return api.patch(`/devices/${deviceId}/`, { fcm_token: fcmToken });
  },
  
  // Logout device
  logoutDevice: (deviceId) => {
    return api.delete(`/devices/${deviceId}/`);
  },
  
  // Logout all devices
  logoutAllDevices: () => {
    return api.post('/devices/logout/all/');
  },
};

export default api;
