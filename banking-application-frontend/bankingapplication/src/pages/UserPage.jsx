import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/bankAccountApi';

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
        .catch((err) => {
          setBankAccounts([]);
        });
    }
  }, [user.id]);

  const handleCreateBankAccount = () => {
    // Redirect to BrowseBank page with userId
    navigate(`/browsebank/${user.id}`);
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
      {/* User Details Section */}
      <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '2rem' }}>
        <h2>User Details</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phonenumber}</p>
        {/* Add more user fields as needed */}
      </div>
      {/* Bank Accounts Section */}
      <div style={{ flex: 2, paddingLeft: '2rem' }}>
        <h2>Bank Accounts</h2>
        {bankAccounts.length === 0 ? (
          <p>No bank accounts found.</p>
        ) : (
          <ul>
            {bankAccounts.map((account, idx) => (
              <li key={idx}>
                <strong>Account Number:</strong> {account.accountNumber} <br />
                <strong>Status:</strong> {account.status}
                {/* Add more account details as needed */}
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleCreateBankAccount} style={{ marginTop: '2rem', padding: '0.75rem 2rem', fontSize: '1rem' }}>
          Create Bank Account
        </button>
      </div>
    </div>
  );
};

export default UserPage;
