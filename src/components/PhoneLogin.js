import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDevice } from '../contexts/DeviceContext';
import { getPasskeyConfig } from '../utils/passkeyConfig';

const PhoneLogin = () => {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('US');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
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
    console.log('🔑 handlePasskeyAuth: Function called');
    console.log('📱 handlePasskeyAuth: Phone number:', phone);
    console.log('🌍 handlePasskeyAuth: Country code:', country);
    
    if (!phone) {
      console.log('❌ handlePasskeyAuth: No phone number provided');
      setError('Please enter a phone number');
      return;
    }
    
    console.log('⏳ handlePasskeyAuth: Setting loading state to true');
    setLoading(true);
    console.log('🧹 handlePasskeyAuth: Clearing previous errors');
    setError('');
    
    try {
      console.log('🔄 handlePasskeyAuth: Starting authentication process');
      console.log('🔄 handlePasskeyAuth: Requesting authentication options from server for phone:', phone);
      
      // First get the authentication options from the server
      console.log('🔄 handlePasskeyAuth: Requesting authentication options for phone:', phone);
      const options = await authenticateWithPasskey(phone);
      console.log('✅ handlePasskeyAuth: Received authentication options:', JSON.stringify(options, null, 2));
      
      // Make sure options is in the correct format for startAuthentication
      if (!options || !options.challenge) {
        console.error('❌ handlePasskeyAuth: Invalid options format - missing challenge property');
        console.error('❌ handlePasskeyAuth: Options received:', options);
        throw new Error('Invalid authentication options format');
      }
      
      console.log('🔑 handlePasskeyAuth: Challenge:', options.challenge);
      console.log('⏳ handlePasskeyAuth: Timeout:', options.timeout);
      console.log('🌐 handlePasskeyAuth: rpId:', options.rpId);
      console.log('🔐 handlePasskeyAuth: allowCredentials:', JSON.stringify(options.allowCredentials));
      console.log('🔒 handlePasskeyAuth: userVerification:', options.userVerification);
      
      // Then use the PasskeyContext to handle the actual authentication
      const deviceId = getDeviceId();
      console.log('📱 handlePasskeyAuth: Device ID:', deviceId);
      
      const userAgent = navigator.userAgent;
      console.log('🌐 handlePasskeyAuth: User Agent:', userAgent);
      
      const fcmToken = null; // You would get this from your FCM setup
      console.log('🔔 handlePasskeyAuth: FCM Token:', fcmToken);
      
      // Import startAuthentication from the browser package
      console.log('📦 handlePasskeyAuth: Importing startAuthentication from @simplewebauthn/browser');
      const { startAuthentication } = await import('@simplewebauthn/browser');
      console.log('✅ handlePasskeyAuth: Successfully imported startAuthentication');
      
      // Get passkey configuration
      console.log('⚙️ handlePasskeyAuth: Getting passkey configuration');
      const passkeyConfig = getPasskeyConfig();
      console.log('⚙️ handlePasskeyAuth: Passkey configuration:', JSON.stringify(passkeyConfig, null, 2));
      
      // Start the authentication process in the browser with our configuration
      console.log('🔐 handlePasskeyAuth: Starting browser authentication with options and config');
      console.log('🔐 handlePasskeyAuth: rpId:', passkeyConfig.rpId);
      console.log('🔐 handlePasskeyAuth: origin:', passkeyConfig.origin);
      
      // Prepare the authentication options with the correct format
      const authOptions = {
        optionsJSON: {
          ...options,
          // Only override rpId and origin if they're not already in the options
          rpId: options.rpId || passkeyConfig.rpId,
          origin: options.origin || passkeyConfig.origin
        }
      };
      
      console.log('🔐 handlePasskeyAuth: Final authentication options:', JSON.stringify(authOptions, null, 2));
      
      // SimpleWebAuthn expects options in a specific format with optionsJSON
      const authResp = await startAuthentication(authOptions);
      
      console.log('✅ handlePasskeyAuth: Authentication response received:', JSON.stringify({
        id: authResp.id,
        type: authResp.type,
        responseKeys: Object.keys(authResp.response)
      }, null, 2));
      console.log('🔑 handlePasskeyAuth: Credential ID:', authResp.id);
      console.log('📊 handlePasskeyAuth: ClientDataJSON length:', authResp.response.clientDataJSON.length);
      console.log('📊 handlePasskeyAuth: AuthenticatorData length:', authResp.response.authenticatorData.length);
      console.log('📊 handlePasskeyAuth: Signature length:', authResp.response.signature.length);
      console.log('👤 handlePasskeyAuth: User handle present:', authResp.response.userHandle ? 'Yes' : 'No');
      
      // Verify the authentication with the server
      console.log('🔄 handlePasskeyAuth: Sending verification request to server');
      const verificationPayload = {
        credential_id: authResp.id,
        client_data_json: authResp.response.clientDataJSON,
        authenticator_data: authResp.response.authenticatorData,
        signature: authResp.response.signature,
        user_handle: authResp.response.userHandle,
        device_id: deviceId,
        fcm_token: fcmToken,
        user_agent: userAgent
      };
      console.log('📤 handlePasskeyAuth: Verification payload keys:', Object.keys(verificationPayload));
      
      const verificationResponse = await verifyPasskeyAuth(verificationPayload);
      console.log('✅ handlePasskeyAuth: Verification response:', JSON.stringify(verificationResponse, null, 2));
      
      if (verificationResponse) {
        console.log('🎉 handlePasskeyAuth: Authentication successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('⚠️ handlePasskeyAuth: Verification response was falsy but did not throw an error');
      }
    } catch (err) {
      console.error('❌ handlePasskeyAuth: Error during authentication:', err);
      console.error('❌ handlePasskeyAuth: Error name:', err.name);
      console.error('❌ handlePasskeyAuth: Error message:', err.message);
      console.error('❌ handlePasskeyAuth: Error stack:', err.stack);
      
      setError('Failed to authenticate with passkey. Try using a verification code instead.');
      console.log('🔄 handlePasskeyAuth: Falling back to code verification');
      setUsePasskeyAuth(false);
      
      console.log('📱 handlePasskeyAuth: Requesting phone verification for:', phone, 'country:', country);
      const success = await requestPhoneVerification(phone, country);
      console.log('📱 handlePasskeyAuth: Phone verification request result:', success ? 'success' : 'failed');
      
      if (success) {
        console.log('✉️ handlePasskeyAuth: Verification code sent, updating UI');
        setCodeSent(true);
      } else {
        console.log('❌ handlePasskeyAuth: Failed to send verification code');
      }
    } finally {
      console.log('⏳ handlePasskeyAuth: Setting loading state to false');
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
