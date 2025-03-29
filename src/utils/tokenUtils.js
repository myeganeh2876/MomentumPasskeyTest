/**
 * Utility functions for JWT token management
 */

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Save authentication tokens to local storage
 * @param {string} accessToken - The JWT access token
 * @param {string} refreshToken - The JWT refresh token
 */
export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Get the stored access token
 * @returns {string|null} The access token or null if not found
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get the stored refresh token
 * @returns {string|null} The refresh token or null if not found
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if the user has valid tokens
 * @returns {boolean} True if the user has tokens, false otherwise
 */
export const hasTokens = () => {
  return !!getAccessToken() && !!getRefreshToken();
};

/**
 * Clear all authentication tokens
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Parse JWT token to get payload data
 * @param {string} token - The JWT token to parse
 * @returns {Object|null} The decoded payload or null if invalid
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Check if the access token is expired
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = () => {
  const token = getAccessToken();
  if (!token) return true;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  // Check if the token is expired (exp is in seconds, Date.now() is in milliseconds)
  return payload.exp * 1000 < Date.now();
};
