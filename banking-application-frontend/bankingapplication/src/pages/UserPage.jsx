import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/bankAccountApi';
import './UserPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaUser } from 'react-icons/fa';

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    navigate(`/browsebank`, { state: { userId: user.id } });
  };

  return (
    <>
      <Header />
      <div className="userpage-container">
        {/* First Part: User Info Row */}
        <div className="user-info-row">
          <div className="user-profile-icon">
            <FaUser size={64} />
          </div>
          <div className="user-details">
            <h2>{user.username || 'User'}</h2>
            <p>UserId: {user.id || 'N/A'}</p>
            <p>Email: {user.email || 'N/A'}</p>
            <p>Phone Number: {user.phonenumber || 'N/A'}</p>
          </div>
          <div className="create-account-btn">
            <button onClick={handleCreateBankAccount}>Create Bank Account</button>
          </div>
        </div>
        {/* Second Part: Accounts List */}
        <div className="accounts-container">
          <h2>Bank Accounts</h2>
          <ul>
            {bankAccounts.length === 0 ? (
              <li>No accounts found.</li>
            ) : (
              bankAccounts.map((account) => (
                <li key={account.id} className="account-item">
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
