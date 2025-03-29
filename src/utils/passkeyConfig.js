/**
 * Configuration utilities for passkey authentication
 */

/**
 * Get the Relying Party ID from environment variables
 * @returns {string} The RP ID
 */
export const getRpId = () => {
  return process.env.REACT_APP_RP_ID || 'localhost';
};

/**
 * Get the Relying Party Name from environment variables
 * @returns {string} The RP Name
 */
export const getRpName = () => {
  return process.env.REACT_APP_RP_NAME || 'Momentum Passkey Demo';
};

/**
 * Get the origin for passkey operations
 * @returns {string} The origin URL
 */
export const getOrigin = () => {
  return process.env.REACT_APP_ORIGIN || 'http://localhost:3000';
};

/**
 * Get the full passkey configuration object
 * @returns {Object} The passkey configuration
 */
export const getPasskeyConfig = () => {
  return {
    rpId: getRpId(),
    rpName: getRpName(),
    origin: getOrigin()
  };
};

const passkeyUtils = {
  getRpId,
  getRpName,
  getOrigin,
  getPasskeyConfig
};

export default passkeyUtils;
