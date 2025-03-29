/**
 * Utility functions for device identification and management
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Get or create a unique device identifier
 * @returns {string} The device ID
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

/**
 * Get the user agent string
 * @returns {string} The user agent string
 */
export const getUserAgent = () => {
  return navigator.userAgent;
};

/**
 * Get the FCM token if available
 * @returns {string|null} The FCM token or null if not available
 */
export const getFcmToken = () => {
  // In a real app, you would get this from Firebase Cloud Messaging
  // This is just a placeholder
  return localStorage.getItem('fcm_token') || null;
};

/**
 * Save the FCM token
 * @param {string} token - The FCM token to save
 */
export const saveFcmToken = (token) => {
  localStorage.setItem('fcm_token', token);
};
