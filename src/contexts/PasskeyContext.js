import React, { createContext, useState, useContext } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { authAPI } from '../api/api';
import { useAuth } from './AuthContext';
import { getPasskeyConfig } from '../utils/passkeyConfig';

// Create the context
const PasskeyContext = createContext();

// Custom hook to use the passkey context
export const usePasskey = () => {
  return useContext(PasskeyContext);
};

// Provider component
export const PasskeyProvider = ({ children }) => {
  const [passkeyCredentials, setPasskeyCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Fetch user's passkey credentials
  const fetchPasskeyCredentials = async () => {
    if (!currentUser?.isLoggedIn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.getPasskeyCredentials();
      setPasskeyCredentials(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch passkey credentials');
    } finally {
      setLoading(false);
    }
  };

  // Register a new passkey
  const registerPasskey = async (name) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get registration options from the server
      const optionsResponse = await authAPI.getPasskeyRegOptions(name);
      const options = optionsResponse.data;
      
      // Get passkey configuration
      const passkeyConfig = getPasskeyConfig();
      
      // Start the registration process in the browser with our configuration
      const attResp = await startRegistration({
        ...options,
        rpId: passkeyConfig.rpId,
        rpName: passkeyConfig.rpName,
        origin: passkeyConfig.origin
      });
      
      // Verify the registration with the server
      const verificationResponse = await authAPI.verifyPasskeyReg({
        credential_id: attResp.id,
        client_data_json: attResp.response.clientDataJSON,
        attestation_object: attResp.response.attestationObject,
        name: name
      });
      
      // Update the credentials list
      await fetchPasskeyCredentials();
      
      return verificationResponse.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Registration was aborted');
      } else if (err.name === 'NotAllowedError') {
        setError('The operation either timed out or was not allowed');
      } else {
        setError(err.response?.data?.message || 'Failed to register passkey');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Authenticate with a passkey
  const authenticateWithPasskey = async (phone, deviceId, fcmToken, userAgent) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get authentication options from the server
      const optionsResponse = await authAPI.getPasskeyAuthOptions(phone);
      const options = optionsResponse.data;
      
      // Get passkey configuration
      const passkeyConfig = getPasskeyConfig();
      
      // Start the authentication process in the browser with our configuration
      const authResp = await startAuthentication({
        ...options,
        rpId: passkeyConfig.rpId,
        origin: passkeyConfig.origin
      });
      
      // Verify the authentication with the server
      const verificationResponse = await authAPI.verifyPasskeyAuth({
        credential_id: authResp.id,
        client_data_json: authResp.response.clientDataJSON,
        authenticator_data: authResp.response.authenticatorData,
        signature: authResp.response.signature,
        user_handle: authResp.response.userHandle,
        device_id: deviceId,
        fcm_token: fcmToken,
        user_agent: userAgent
      });
      
      return verificationResponse.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Authentication was aborted');
      } else if (err.name === 'NotAllowedError') {
        setError('The operation either timed out or was not allowed');
      } else {
        setError(err.response?.data?.message || 'Failed to authenticate with passkey');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a passkey credential
  const deletePasskeyCredential = async (credentialId) => {
    setLoading(true);
    setError(null);
    
    try {
      await authAPI.deletePasskeyCredential(credentialId);
      
      // Update the credentials list
      await fetchPasskeyCredentials();
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete passkey credential');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    passkeyCredentials,
    loading,
    error,
    fetchPasskeyCredentials,
    registerPasskey,
    authenticateWithPasskey,
    deletePasskeyCredential
  };

  return (
    <PasskeyContext.Provider value={value}>
      {children}
    </PasskeyContext.Provider>
  );
};

export default PasskeyContext;
