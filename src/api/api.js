import axios from 'axios';
import { getAccessToken, saveTokens } from '../utils/tokenUtils';

// Function to get CSRF token from cookies
function getCsrfToken() {
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return '';
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000', // Use environment variable with fallback
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in cross-origin requests
});

// Add a request interceptor to add the token and CSRF token to all requests
api.interceptors.request.use(
  (config) => {
    console.log('📡 API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    
    // Add CSRF token to all non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        console.log('🔒 CSRF Token added to request');
      } else {
        console.warn('⚠️ No CSRF token found in cookies');
      }
    }
    
    const token = getAccessToken();
    if (token) {
      // Ensure the token has the Bearer prefix
      const tokenWithPrefix = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = tokenWithPrefix;
      console.log('🔑 Token added to request:', tokenWithPrefix.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No token available for request');
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using the refresh endpoint
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        // Save the new tokens using tokenUtils
        saveTokens(response.data.access, response.data.refresh);
        
        // Retry the original request with the new token
        // Ensure the token has the Bearer prefix
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
  getPasskeyAuthOptions: (payload) => {
    console.log('🔑 API: Getting passkey authentication options with payload:', payload);
    
    // Create a special axios instance without the token interceptor for this request
    // since we're authenticating and don't have a token yet
    const authApi = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies in cross-origin requests
    });
    
    // Add CSRF token to the request
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      authApi.defaults.headers.common['X-CSRFToken'] = csrfToken;
      console.log('🔒 CSRF Token added to passkey options request');
    } else {
      console.warn('⚠️ No CSRF token found for passkey options request');
    }
    
    console.log('🔑 API: Making passkey options request WITHOUT token');
    return authApi.post('/auth/passkey/authenticate/options/', payload);
  },
  
  verifyPasskeyAuth: (authResponse) => {
    console.log('🔑 API: Verifying passkey authentication with payload:', {
      credential_id: authResponse.credential_id,
      // Don't log the full data for security, just indicate it's present
      has_client_data: !!authResponse.client_data_json,
      has_authenticator_data: !!authResponse.authenticator_data,
      has_signature: !!authResponse.signature,
      has_user_handle: !!authResponse.user_handle,
      phone: authResponse.phone
    });
    
    // Create a special axios instance without the token interceptor for this request
    // since we're authenticating and don't have a token yet
    const authApi = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies in cross-origin requests
    });
    
    // Add CSRF token to the request
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      authApi.defaults.headers.common['X-CSRFToken'] = csrfToken;
      console.log('🔒 CSRF Token added to passkey verification request');
    } else {
      console.warn('⚠️ No CSRF token found for passkey verification request');
    }
    
    console.log('🔑 API: Making passkey verification request WITHOUT token');
    return authApi.post('/auth/passkey/authenticate/verify/', authResponse);
  },
  
  // Debug WebAuthn authentication
  debugPasskeyAuth: (authResponse) => {
    console.log('🔑 API: Debugging passkey authentication with payload:', {
      credential_id: authResponse.credential_id,
      phone: authResponse.phone
    });
    
    // Create a special axios instance without the token interceptor for this request
    const authApi = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies in cross-origin requests
    });
    
    // Add CSRF token to the request
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      authApi.defaults.headers.common['X-CSRFToken'] = csrfToken;
      console.log('🔒 CSRF Token added to passkey debug request');
    } else {
      console.warn('⚠️ No CSRF token found for passkey debug request');
    }
    
    console.log('🔑 API: Making passkey debug request WITHOUT token');
    return authApi.post('/auth/passkey/authenticate/debug/', authResponse);
  },
  
  // Passkey registration
  getPasskeyRegOptions: (name) => {
    return api.post('/auth/passkey/register/options/', { name });
  },
  
  verifyPasskeyReg: (regResponse) => {
    return api.post('/auth/passkey/register/verify/', regResponse);
  },
  
  // Trigger passkey registration after login
  triggerPasskeyRegistration: () => {
    console.log('🔑 Triggering passkey registration');
    return api.get('/auth/passkey/register/trigger/')
      .then(response => {
        console.log('✅ Passkey registration triggered successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ Failed to trigger passkey registration:', error.response || error);
        throw error;
      });
  },
  
  // Get passkey credentials
  getPasskeyCredentials: () => {
    return api.get('/auth/passkey/credentials/');
  },
  
  // Delete passkey credential
  deletePasskeyCredential: (credentialId) => {
    return api.delete(`/auth/passkey/credentials/${credentialId}/`);
  },
  
  // Get supported countries for phone login
  getCountries: () => {
    console.log('🌍 API: Fetching supported countries');
    return api.get('/auth/phone/countries/');
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
