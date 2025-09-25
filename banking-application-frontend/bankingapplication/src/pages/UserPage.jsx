import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/bankAccountApi';
import './UserPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaUser } from 'react-icons/fa'; // Changed to FaUser for a simple user icon

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Assume user object is passed via location.state from SignIn page
  const user = location.state?.user || {};
  const [bankAccounts, setBankAccounts] = useState([]);
  useEffect(() => {
    if (user.id) {
      getUserBankAccounts(user.id)
        .then(setBankAccounts)
        .catch(() => {
          setBankAccounts([]);
        });
    }
  }, [user.id]);

  const handleCreateBankAccount = () => {
    // Redirect to BrowseBank page with userId
    navigate(`/browsebank`);
  };

  return (
    <>
      <Header />
      <div
        className="userpage-container"
        style={{
          display: 'flex',
          flexDirection: 'column', // Changed from 'row' to 'column'
          minHeight: '70vh',
          width: '100%',
        }}
      >
        {/* User Info Section */}
        <div
          className="user-section"
          style={{
            flex: 1,
            padding: '2rem',
            borderBottom: '1px solid #eee', // Changed to bottom border
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FaUser size={64} style={{ marginBottom: '1rem' }} />
          <h2>{user.name || 'User'}</h2>
          <p>Email: {user.email || 'N/A'}</p>
          <p>User ID: {user.id || 'N/A'}</p>
        </div>
        {/* Accounts Section */}
        <div
          className="accounts-section"
          style={{
            flex: 2,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Bank Accounts</h2>
            <button onClick={handleCreateBankAccount}>Create Bank Account</button>
          </div>
          <ul style={{ marginTop: '1rem' }}>
            {bankAccounts.length === 0 ? (
              <li>No accounts found.</li>
            ) : (
              bankAccounts.map((account) => (
                <li
                  key={account.id}
                  style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                  }}
                >
                  <strong>Account Number:</strong> {account.accountNumber}
                  <br />
                  <strong>Type:</strong> {account.type}
                  <br />
                  <strong>Balance:</strong> ${account.balance}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserPage;
