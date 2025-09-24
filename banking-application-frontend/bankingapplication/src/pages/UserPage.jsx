import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/bankAccountApi';
import './UserPage.css';

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
    <div className="userpage-container-vertical">
      {/* User Details Section */}
      <div className="userpage-details">
        <h2>User Details</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phonenumber}</p>
        {/* Add more user fields as needed */}
      </div>
      {/* Bank Accounts Section */}
      <div className="userpage-accounts">
        <h2>Bank Accounts</h2>
        {bankAccounts.length === 0 ? (
          <p>No bank accounts found.</p>
        ) : (
          <ul className="userpage-account-list">
            {bankAccounts.map((account, idx) => (
              <li key={idx} className="userpage-account-item">
                <strong>Account Number:</strong> {account.accountNumber} <br />
                <strong>Status:</strong> {account.status}
                {/* Add more account details as needed */}
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleCreateBankAccount} className="userpage-create-btn">
          Create Bank Account
        </button>
      </div>
    </div>
  );
};

export default UserPage;
