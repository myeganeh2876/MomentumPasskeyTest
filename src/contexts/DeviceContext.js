import React, { createContext, useState, useContext } from 'react';
import { devicesAPI } from '../api/api';
import { useAuth } from './AuthContext';
import { getDeviceId as getDeviceUUID } from '../utils/deviceUtils';

// Create the context
const DeviceContext = createContext();

// Custom hook to use the device context
export const useDevice = () => {
  return useContext(DeviceContext);
};

// Provider component
export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Get the device ID using the UUID-based implementation from deviceUtils
  const getDeviceId = () => {
    return getDeviceUUID();
  };

  // Fetch all user devices
  const fetchDevices = async () => {
    if (!currentUser?.isLoggedIn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await devicesAPI.getDevices();
      setDevices(response.data);
      
      // Check if current device is in the list
      const deviceId = getDeviceId();
      const currentDeviceData = response.data.find(d => d.device_id === deviceId);
      if (currentDeviceData) {
        setCurrentDevice(currentDeviceData);
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch devices');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get details for a specific device
  const getDeviceDetails = async (deviceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await devicesAPI.getDeviceDetails(deviceId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get device details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update FCM token for a device
  const updateDeviceFCMToken = async (deviceId, fcmToken) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await devicesAPI.updateDeviceFCMToken(deviceId, fcmToken);
      
      // If this is the current device, update the state
      if (deviceId === getDeviceId()) {
        setCurrentDevice(response.data);
      }
      
      // Refresh the devices list
      await fetchDevices();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update FCM token');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Logout a specific device
  const logoutDevice = async (deviceId) => {
    setLoading(true);
    setError(null);
    
    try {
      await devicesAPI.logoutDevice(deviceId);
      
      // If this is the current device, clear local storage
      if (deviceId === getDeviceId()) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      
      // Refresh the devices list
      await fetchDevices();
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to logout device');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout all devices
  const logoutAllDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await devicesAPI.logoutAllDevices();
      
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear devices state
      setDevices([]);
      setCurrentDevice(null);
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to logout all devices');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    devices,
    currentDevice,
    loading,
    error,
    getDeviceId,
    fetchDevices,
    getDeviceDetails,
    updateDeviceFCMToken,
    logoutDevice,
    logoutAllDevices
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};

export default DeviceContext;
