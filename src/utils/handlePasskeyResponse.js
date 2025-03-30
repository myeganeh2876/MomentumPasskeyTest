/**
 * Utility function to handle passkey authentication responses
 */
import { saveTokens } from './tokenUtils';

/**
 * Process the passkey authentication response and log in the user
 * @param {Object} responseData - The response data from passkey authentication
 * @param {Function} setCurrentUser - Function to update the current user state
 * @param {Function} navigate - React Router navigate function (optional)
 * @returns {Object} The processed user data
 */
export const handlePasskeyResponse = (responseData, setCurrentUser, navigate = null) => {
  console.log('🔍 handlePasskeyResponse: Processing authentication response');
  
  // Extract tokens and user data
  const { access, refresh, user, device } = responseData;
  
  // Log successful authentication
  console.log('✅ handlePasskeyResponse: Authentication successful:', {
    user: user,
    device: device?.id
  });
  
  // Save tokens
  console.log('💾 handlePasskeyResponse: Saving tokens');
  saveTokens(access, refresh);
  
  // Update user state
  console.log('👤 handlePasskeyResponse: Setting current user');
  const userData = { 
    isLoggedIn: true,
    phone: user?.phone,
    country: user?.country,
    firstName: user?.first_name,
    lastName: user?.last_name
  };
  
  if (setCurrentUser) {
    setCurrentUser(userData);
  }
  
  // Navigate to dashboard if navigate function is provided
  if (navigate) {
    console.log('🚀 handlePasskeyResponse: Navigating to dashboard');
    navigate('/dashboard');
  }
  
  console.log('🎉 handlePasskeyResponse: Login successful');
  return userData;
};

/**
 * Parse and handle a raw JSON response string from passkey authentication
 * @param {string} jsonResponse - The JSON response string
 * @param {Function} setCurrentUser - Function to update the current user state
 * @param {Function} navigate - React Router navigate function (optional)
 * @returns {Object} The processed user data
 */
export const handlePasskeyJsonResponse = (jsonResponse, setCurrentUser, navigate = null) => {
  console.log('🔍 handlePasskeyJsonResponse: Parsing JSON response');
  
  try {
    // Parse the JSON response if it's a string
    const responseData = typeof jsonResponse === 'string' 
      ? JSON.parse(jsonResponse) 
      : jsonResponse;
    
    return handlePasskeyResponse(responseData, setCurrentUser, navigate);
  } catch (error) {
    console.error('❌ handlePasskeyJsonResponse: Error parsing response:', error);
    throw new Error('Failed to parse authentication response');
  }
};

// Create a named object for the default export
const passkeyResponseUtils = {
  handlePasskeyResponse,
  handlePasskeyJsonResponse
};

export default passkeyResponseUtils;
