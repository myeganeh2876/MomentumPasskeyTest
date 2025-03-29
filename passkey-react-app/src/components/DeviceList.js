import React, { useEffect } from 'react';
import { useDevice } from '../contexts/DeviceContext';

const DeviceList = () => {
  const { 
    devices, 
    currentDevice, 
    loading, 
    error, 
    fetchDevices, 
    logoutDevice 
  } = useDevice();

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleLogoutDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to log out this device?')) {
      await logoutDevice(deviceId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && devices.length === 0) {
    return <div className="loading">Loading devices...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (devices.length === 0) {
    return <div className="no-data">No devices found.</div>;
  }

  return (
    <div className="device-list">
      <table>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>User Agent</th>
            <th>Last Login</th>
            <th>IP Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.id} className={currentDevice?.id === device.id ? 'current-device' : ''}>
              <td>{device.device_id}</td>
              <td>{device.user_agent || 'Unknown'}</td>
              <td>{formatDate(device.last_login)}</td>
              <td>{device.ip_address || 'Unknown'}</td>
              <td>
                <span className={`status ${device.is_active ? 'active' : 'inactive'}`}>
                  {device.is_active ? 'Active' : 'Inactive'}
                </span>
                {currentDevice?.id === device.id && (
                  <span className="current-label">(Current)</span>
                )}
              </td>
              <td>
                {device.is_active && (
                  <button 
                    onClick={() => handleLogoutDevice(device.id)}
                    disabled={loading}
                    className="logout-button"
                  >
                    Logout
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceList;
