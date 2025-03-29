import React, { useEffect } from 'react';
import { usePasskey } from '../contexts/PasskeyContext';

const PasskeyList = () => {
  const { 
    passkeyCredentials, 
    loading, 
    error, 
    fetchPasskeyCredentials, 
    deletePasskeyCredential 
  } = usePasskey();

  useEffect(() => {
    fetchPasskeyCredentials();
  }, [fetchPasskeyCredentials]);

  const handleDeletePasskey = async (credentialId) => {
    if (window.confirm('Are you sure you want to delete this passkey?')) {
      await deletePasskeyCredential(credentialId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && passkeyCredentials.length === 0) {
    return <div className="loading">Loading passkeys...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (passkeyCredentials.length === 0) {
    return <div className="no-data">No passkeys found. Register a new passkey to enhance your security.</div>;
  }

  return (
    <div className="passkey-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Created</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {passkeyCredentials.map(credential => (
            <tr key={credential.id}>
              <td>{credential.name || 'Unnamed Passkey'}</td>
              <td>{formatDate(credential.created_at)}</td>
              <td>{formatDate(credential.last_used_at)}</td>
              <td>
                <button 
                  onClick={() => handleDeletePasskey(credential.id)}
                  disabled={loading}
                  className="delete-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PasskeyList;
