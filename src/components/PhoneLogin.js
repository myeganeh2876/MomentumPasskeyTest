import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDevice } from '../contexts/DeviceContext';

const PhoneLogin = () => {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('US');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usePasskeyAuth, setUsePasskeyAuth] = useState(false);

  const { requestPhoneVerification, verifyPhone, authenticateWithPasskey, verifyPasskeyAuth, error: authError } = useAuth();
  const { getDeviceId } = useDevice();
  
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const success = await requestPhoneVerification(phone, country);
      if (success) {
        setCodeSent(true);
      } else {
        setError(authError || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An error occurred while sending the verification code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!code) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const deviceId = getDeviceId();
      const userAgent = navigator.userAgent;
      const fcmToken = null; // You would get this from your FCM setup
      
      const success = await verifyPhone(phone, code, country, deviceId, fcmToken, userAgent);
      if (success) {
        navigate('/dashboard');
      } else {
        setError(authError || 'Failed to verify code');
      }
    } catch (err) {
      setError('An error occurred while verifying the code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First get the authentication options from the server
      const options = await authenticateWithPasskey(phone);
      
      // Then use the PasskeyContext to handle the actual authentication
      const deviceId = getDeviceId();
      const userAgent = navigator.userAgent;
      const fcmToken = null; // You would get this from your FCM setup
      
      // Import startAuthentication from the browser package
      const { startAuthentication } = await import('@simplewebauthn/browser');
      
      // Start the authentication process in the browser
      const authResp = await startAuthentication(options);
      
      // Verify the authentication with the server
      const verificationResponse = await verifyPasskeyAuth({
        credential_id: authResp.id,
        client_data_json: authResp.response.clientDataJSON,
        authenticator_data: authResp.response.authenticatorData,
        signature: authResp.response.signature,
        user_handle: authResp.response.userHandle,
        device_id: deviceId,
        fcm_token: fcmToken,
        user_agent: userAgent
      });
      
      if (verificationResponse) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to authenticate with passkey. Try using a verification code instead.');
      console.error(err);
      // Fall back to code verification
      setUsePasskeyAuth(false);
      const success = await requestPhoneVerification(phone, country);
      if (success) {
        setCodeSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      
      {!codeSent ? (
        <form onSubmit={handleSendCode}>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              {/* Add more countries as needed */}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +15552345678"
              disabled={loading}
              required
            />
            <small>Enter phone number in international format (e.g. +15552345678)</small>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
            
            <button
              type="button"
              onClick={handlePasskeyAuth}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Use Passkey'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the 6-digit code"
              disabled={loading}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <button
              type="button"
              onClick={() => setCodeSent(false)}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneLogin;
