import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDevice } from '../contexts/DeviceContext';
import { usePasskey } from '../contexts/PasskeyContext';
import DeviceList from './DeviceList';
import PasskeyList from './PasskeyList';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  
  const { currentUser, logout } = useAuth();
  const { currentDevice, fetchDevices, logoutAllDevices } = useDevice();
  const { registerPasskey, fetchPasskeyCredentials } = usePasskey();
  
  const navigate = useNavigate();

  // State to track if data has been fetched already
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch devices and passkey credentials on component mount
  useEffect(() => {
    if (!currentUser?.isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // Only fetch if we haven't fetched data yet
    if (!dataFetched) {
      console.log('📱 Dashboard: Fetching devices and passkey credentials');
      fetchDevices();
      fetchPasskeyCredentials();
      setDataFetched(true);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, currentUser, dataFetched]); // Include dataFetched in dependencies

  const handleLogout = async () => {
    if (currentDevice) {
      await logout(currentDevice.id);
      navigate('/login');
    }
  };

  const handleLogoutAllDevices = async () => {
    await logoutAllDevices();
    navigate('/login');
  };

  const handleRegisterPasskey = async (e) => {
    e.preventDefault();
    
    if (!passkeyName.trim()) {
      alert('Please enter a name for your passkey');
      return;
    }
    
    try {
      await registerPasskey(passkeyName);
      setIsRegisteringPasskey(false);
      setPasskeyName('');
    } catch (err) {
      console.error('Failed to register passkey:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-actions">
          <button onClick={handleLogout}>Logout</button>
          <button onClick={handleLogoutAllDevices}>Logout All Devices</button>
        </div>
      </header>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'devices' ? 'active' : ''} 
          onClick={() => setActiveTab('devices')}
        >
          Devices
        </button>
        <button 
          className={activeTab === 'passkeys' ? 'active' : ''} 
          onClick={() => setActiveTab('passkeys')}
        >
          Passkeys
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'devices' ? (
          <div className="devices-section">
            <h2>Your Devices</h2>
            <DeviceList />
          </div>
        ) : (
          <div className="passkeys-section">
            <div className="passkey-header">
              <h2>Your Passkeys</h2>
              {!isRegisteringPasskey ? (
                <button onClick={() => setIsRegisteringPasskey(true)}>
                  Register New Passkey
                </button>
              ) : (
                <form onSubmit={handleRegisterPasskey} className="register-passkey-form">
                  <input
                    type="text"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="Passkey name (e.g. My iPhone)"
                    required
                  />
                  <button type="submit">Register</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegisteringPasskey(false);
                      setPasskeyName('');
                    }}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
            <PasskeyList />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
