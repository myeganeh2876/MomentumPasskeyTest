import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDevice } from '../contexts/DeviceContext';
import { getPasskeyConfig } from '../utils/passkeyConfig';
import { saveTokens } from '../utils/tokenUtils';
import { authAPI } from '../api/api';

const PhoneLogin = () => {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('US');
  const [countries, setCountries] = useState([]);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [usePasskeyAuth, setUsePasskeyAuth] = useState(false);

  const { requestPhoneVerification, verifyPhone, error: authError, setCurrentUser } = useAuth();
  const { getDeviceId } = useDevice();
  
  const navigate = useNavigate();
  
  // Fetch countries when component mounts
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        console.log('🌍 PhoneLogin: Fetching countries from API');
        const response = await authAPI.getCountries();
        console.log('🌍 PhoneLogin: Countries fetched successfully:', response.data);
        setCountries(response.data);
        
        // If countries are loaded and the current country is not in the list,
        // set the first country as default
        if (response.data.length > 0) {
          const countryCodes = response.data.map(c => c.code);
          if (!countryCodes.includes(country)) {
            console.log(`🌍 PhoneLogin: Current country ${country} not found in API response, setting default`);
            setCountry(response.data[0].code);
          }
        }
      } catch (err) {
        console.error('❌ PhoneLogin: Error fetching countries:', err);
        // Set some default countries in case the API fails
        setCountries([
          { code: 'US', name: 'United States', phone_prefix: '+1' },
          { code: 'CA', name: 'Canada', phone_prefix: '+1' },
          { code: 'GB', name: 'United Kingdom', phone_prefix: '+44' }
        ]);
      }
    };
    
    fetchCountries();
  }, [country]); // Added country as a dependency

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
    console.log('🔍 handleVerifyCode: Function called with code:', code);
    
    if (!code) {
      setError('Please enter the verification code');
      console.log('❌ handleVerifyCode: No verification code entered');
      return;
    }
    
    setLoading(true);
    setError('');
    console.log('🔄 handleVerifyCode: Starting verification process');
    
    try {
      const deviceId = getDeviceId();
      console.log('📱 handleVerifyCode: Device ID:', deviceId);
      const userAgent = navigator.userAgent;
      const fcmToken = null; // You would get this from your FCM setup
      
      console.log('📡 handleVerifyCode: Calling verifyPhone with:', { phone, code, country });
      // We're passing a callback function that will be called after passkey registration is attempted
      const success = await verifyPhone(phone, code, country, deviceId, fcmToken, userAgent, () => {
        console.log('🎉 handleVerifyCode: Verification and passkey registration completed, navigating to dashboard');
        navigate('/dashboard');
      });
      console.log('📢 handleVerifyCode: verifyPhone result:', success);
      
      if (!success) {
        console.log('❌ handleVerifyCode: Verification failed:', authError);
        setError(authError || 'Failed to verify code');
      }
      // Note: We don't navigate here anymore, the callback will handle it
    } catch (err) {
      console.error('❌ handleVerifyCode: Error during verification:', err);
      setError('An error occurred while verifying the code');
    } finally {
      console.log('🔔 handleVerifyCode: Verification process completed');
      setLoading(false);
    }
  };

  const debugPasskeyAuth = async (authResp) => {
    console.log('🔧 debugPasskeyAuth: Debugging authentication response');
    
    try {
      // Prepare the verification payload with the same format as the regular verification
      const deviceId = getDeviceId();
      const userAgent = navigator.userAgent;
      const fcmToken = null;
      
      const debugPayload = {
        credential_id: authResp.id,
        client_data_json: authResp.response.clientDataJSON,
        authenticator_data: authResp.response.authenticatorData,
        signature: authResp.response.signature,
        user_handle: authResp.response.userHandle,
        device_id: deviceId,
        fcm_token: fcmToken,
        user_agent: userAgent,
        phone: phone  // Include the phone number in the debug payload
      };
      
      console.log('🔧 debugPasskeyAuth: Sending debug request with payload');
      const debugResponse = await authAPI.debugPasskeyAuth(debugPayload);
      console.log('🔧 debugPasskeyAuth: Debug response received:', debugResponse.data);
      
      // Display the debug information
      setError(JSON.stringify(debugResponse.data, null, 2));
    } catch (err) {
      console.error('❌ debugPasskeyAuth: Error during debug:', err);
      setError(`Debug error: ${err.message}\n${JSON.stringify(err.response?.data || {}, null, 2)}`);
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
      
      // Step 1: Get authentication options from the server with the phone number
      console.log('🔄 handlePasskeyAuth: Step 1 - Requesting authentication options for phone:', phone);
      
      // Make sure we're sending the phone in the correct format
      const phonePayload = { phone };
      console.log('📤 handlePasskeyAuth: Sending phone payload:', phonePayload);
      
      const optionsResponse = await authAPI.getPasskeyAuthOptions(phonePayload);
      console.log('✅ handlePasskeyAuth: Received raw authentication options response:', optionsResponse.data);
      
      // Parse the options if needed
      let options = optionsResponse.data;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (parseError) {
          console.error('❌ handlePasskeyAuth: Failed to parse authentication options:', parseError);
          throw new Error('Invalid authentication options format');
        }
      }
      console.log('✅ handlePasskeyAuth: Parsed authentication options:', JSON.stringify(options, null, 2));
      
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
      
      // SimpleWebAuthn expects the options directly, not wrapped in an optionsJSON property
      // Make sure we're using the server's options directly
      console.log('🔐 handlePasskeyAuth: Using server options directly:', JSON.stringify(options, null, 2));
      
      // Start the authentication process with the server's options
      const authResp = await startAuthentication(options);
      
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
      
      // Step 2: Verify the authentication with the server
      console.log('🔄 handlePasskeyAuth: Step 2 - Sending verification request to server');
      const verificationPayload = {
        credential_id: authResp.id,
        client_data_json: authResp.response.clientDataJSON,
        authenticator_data: authResp.response.authenticatorData,
        signature: authResp.response.signature,
        user_handle: authResp.response.userHandle,
        device_id: deviceId,
        fcm_token: fcmToken,
        user_agent: userAgent,
        phone: phone  // Include the phone number in the verification payload
      };
      console.log('📤 handlePasskeyAuth: Verification payload keys:', Object.keys(verificationPayload));
      
      // Call the API directly to ensure we're following the correct sequence
      const verificationResponse = await authAPI.verifyPasskeyAuth(verificationPayload);
      console.log('✅ handlePasskeyAuth: Verification response:', JSON.stringify(verificationResponse.data, null, 2));
      
      // Save tokens from the verification response
      if (verificationResponse.data.access && verificationResponse.data.refresh) {
        console.log('💾 handlePasskeyAuth: Saving tokens from verification response');
        const accessToken = `${verificationResponse.data.access}`;
        saveTokens(accessToken, verificationResponse.data.refresh);
        setCurrentUser({ isLoggedIn: true });
      } else {
        console.warn('⚠️ handlePasskeyAuth: No tokens in verification response');
      }
      
      // Check if we have a successful response with tokens
      if (verificationResponse && verificationResponse.data && verificationResponse.data.access) {
        console.log('🎉 handlePasskeyAuth: Authentication successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('⚠️ handlePasskeyAuth: Verification response did not contain expected data');
        setError('Authentication failed. Using debug endpoint to troubleshoot...');
        
        // Call the debug function with the authentication response to get more information
        await debugPasskeyAuth(authResp);
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
              {countries.length > 0 ? (
                countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.phone_prefix})
                  </option>
                ))
              ) : (
                <option value="US">United States</option>
              )}
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
            

            
            {process.env.NODE_ENV !== 'production' && (
              <button
                type="button"
                className="debug-button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    // Get authentication options
                    const phonePayload = { phone };
                    const optionsResponse = await authAPI.getPasskeyAuthOptions(phonePayload);
                    console.log('🔧 Debug: Authentication options:', optionsResponse.data);
                    
                    // Start authentication
                    const { startAuthentication } = await import('@simplewebauthn/browser');
                    
                    // Ensure options are properly formatted
                    let options = optionsResponse.data;
                    if (typeof options === 'string') {
                      try {
                        options = JSON.parse(options);
                      } catch (parseError) {
                        console.error('❌ Debug: Failed to parse authentication options:', parseError);
                        throw new Error('Invalid authentication options format');
                      }
                    }
                    
                    console.log('✅ Debug: Parsed authentication options:', JSON.stringify(options, null, 2));
                    
                    // Make sure options is in the correct format for startAuthentication
                    if (!options || !options.challenge) {
                      console.error('❌ Debug: Invalid options format - missing challenge property');
                      console.error('❌ Debug: Options received:', options);
                      throw new Error('Invalid authentication options format');
                    }
                    
                    // SimpleWebAuthn expects options in a specific format
                    console.log('🔑 Debug: Challenge:', options.challenge);
                    console.log('⏱ Debug: Timeout:', options.timeout);
                    console.log('🌐 Debug: rpId:', options.rpId);
                    console.log('🔐 Debug: allowCredentials:', JSON.stringify(options.allowCredentials));
                    
                    // Make sure to pass the options directly to startAuthentication
                    const authResp = await startAuthentication(options);
                    
                    // Call the debug endpoint
                    await debugPasskeyAuth(authResp);
                  } catch (err) {
                    console.error('❌ Debug button error:', err);
                    setError(`Debug error: ${err.message}`);
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Debug WebAuthn
              </button>
            )}
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
