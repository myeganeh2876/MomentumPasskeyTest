import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/api';
import { saveTokens, getAccessToken, clearTokens } from '../utils/tokenUtils';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          // You could verify the token here if needed
          // For now, we'll just assume the user is logged in if the token exists
          setCurrentUser({ isLoggedIn: true });
        } catch (err) {
          console.error('Failed to verify token:', err);
          clearTokens();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Phone login functions
  const requestPhoneVerification = async (phone, country) => {
    setError(null);
    try {
      await authAPI.requestPhoneVerification(phone, country);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
      return false;
    }
  };

  const verifyPhone = async (phone, code, country, deviceId, fcmToken, userAgent) => {
    setError(null);
    try {
      const response = await authAPI.verifyPhone(
        phone, code, country, deviceId, fcmToken, userAgent
      );
      
      // Save tokens using tokenUtils
      saveTokens(response.data.access, response.data.refresh);
      
      setCurrentUser({ isLoggedIn: true });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify code');
      return false;
    }
  };

  // Passkey authentication functions
  const authenticateWithPasskey = async (phone) => {
    setError(null);
    try {
      // Get authentication options
      const optionsResponse = await authAPI.getPasskeyAuthOptions(phone);
      
      // Check if the response data is a string (JSON) and parse it if needed
      if (typeof optionsResponse.data === 'string') {
        try {
          return JSON.parse(optionsResponse.data);
        } catch (parseError) {
          console.error('Failed to parse authentication options:', parseError);
          throw new Error('Invalid authentication options format');
        }
      }
      
      return optionsResponse.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get authentication options');
      throw err;
    }
  };

  const verifyPasskeyAuth = async (authResponse) => {
    setError(null);
    try {
      const response = await authAPI.verifyPasskeyAuth(authResponse);
      
      // Save tokens using tokenUtils
      saveTokens(response.data.access, response.data.refresh);
      
      setCurrentUser({ isLoggedIn: true });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify passkey');
      return false;
    }
  };

  // Logout function
  const logout = async (deviceId) => {
    try {
      if (deviceId) {
        await authAPI.logoutDevice(deviceId);
      }
      
      // Clear tokens using tokenUtils
      clearTokens();
      
      setCurrentUser(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to logout');
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    requestPhoneVerification,
    verifyPhone,
    authenticateWithPasskey,
    verifyPasskeyAuth,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
