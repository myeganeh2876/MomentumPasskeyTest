import React, { createContext, useState, useEffect, useContext } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
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

  const verifyPhone = async (phone, code, country, deviceId, fcmToken, userAgent, onComplete) => {
    console.log('🔍 verifyPhone: Function called with phone:', phone, 'code:', code);
    setError(null);
    try {
      console.log('🔄 verifyPhone: Sending verification request to server');
      const response = await authAPI.verifyPhone(
        phone, code, country, deviceId, fcmToken, userAgent
      );
      console.log('✅ verifyPhone: Verification successful, response:', response.data);
      
      // Save tokens using tokenUtils
      console.log('💾 verifyPhone: Saving tokens');

      const accessToken = `${response.data.access}`;
      saveTokens(accessToken, response.data.refresh);
      console.log('🔑 verifyPhone: Access token saved');
      
      console.log('👤 verifyPhone: Setting current user');
      setCurrentUser({ isLoggedIn: true });
      
      // Trigger passkey registration from the backend
      console.log('🔑 verifyPhone: About to trigger passkey registration');
      try {
        // Get registration options from the backend
        console.log('📡 verifyPhone: Calling triggerPasskeyRegistration API');
        const triggerResponse = await authAPI.triggerPasskeyRegistration();
        console.log('✅ verifyPhone: Passkey registration triggered successfully:', triggerResponse.data);
        
        // Check if the user already has passkeys
        if (triggerResponse.data.has_passkeys === false && triggerResponse.data.options) {
          console.log('🔑 verifyPhone: User has no passkeys, starting registration');
          
          try {
            // Parse the options from the response
            let options = triggerResponse.data.options;
            if (typeof options === 'string') {
              try {
                options = JSON.parse(options);
              } catch (parseError) {
                console.error('❌ verifyPhone: Failed to parse registration options:', parseError);
                throw new Error('Invalid registration options format');
              }
            }
            console.log('🔑 verifyPhone: Registration options from server:', options);
            
            // Use the server's options directly without overriding
            // This ensures we use the same rpId and origin as the server expects
            console.log('🔑 verifyPhone: Starting registration with server options');
            const attResp = await startRegistration(options);
            console.log('✅ verifyPhone: Browser registration completed:', attResp);
            
            // Verify the registration with the server
            // Convert the ArrayBuffer to Base64 string for rawId
            const rawId = attResp.rawId ? attResp.rawId : 
                          (attResp.id ? new TextEncoder().encode(attResp.id).buffer : null);
            
            // Create a proper base64 string from the rawId ArrayBuffer if it exists
            let rawIdBase64 = '';
            if (rawId) {
              const rawIdArray = new Uint8Array(rawId);
              const rawIdString = String.fromCharCode.apply(null, rawIdArray);
              rawIdBase64 = btoa(rawIdString);
            }
            
            console.log('🔑 verifyPhone: Preparing verification payload with rawId');
            const verifyResponse = await authAPI.verifyPasskeyReg({
              credential_id: attResp.id,
              raw_id: rawIdBase64, // Include the rawId as required by the server
              client_data_json: attResp.response.clientDataJSON,
              attestation_object: attResp.response.attestationObject,
              name: `${navigator.platform} - ${new Date().toLocaleDateString()}`
            });
            
            console.log('✅ verifyPhone: Passkey registration verified:', verifyResponse.data);
          } catch (regError) {
            console.error('❌ verifyPhone: Error during passkey registration:', regError);
            if (regError.name === 'NotAllowedError') {
              console.log('❌ verifyPhone: User declined to create a passkey');
            } else if (regError.name === 'AbortError') {
              console.log('❌ verifyPhone: Passkey registration was aborted');
            }
            // We don't want to fail the login if passkey registration fails
          }
        } else {
          console.log('🔑 verifyPhone: User already has passkeys or no options returned');
        }
      } catch (passkeyError) {
        console.error('❌ verifyPhone: Failed to trigger passkey registration:', passkeyError);
        // We don't want to fail the login if passkey registration fails
        // So we just log the error and continue
      } finally {
        // Always call the onComplete callback if it exists, regardless of whether passkey registration succeeded
        console.log('🔔 verifyPhone: Calling onComplete callback');
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
      
      console.log('🎉 verifyPhone: Login successful, returning true');
      return true;
    } catch (err) {
      console.error('❌ verifyPhone: Error during verification:', err);
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
