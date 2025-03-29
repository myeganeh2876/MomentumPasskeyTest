import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import PhoneLogin from './components/PhoneLogin';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { PasskeyProvider } from './contexts/PasskeyContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DeviceProvider>
          <PasskeyProvider>
            <div className="App">
              <Routes>
                <Route path="/login" element={<PhoneLogin />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          </PasskeyProvider>
        </DeviceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
