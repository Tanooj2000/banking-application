import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/bankAccountApi';
import { updateUserDetails, changeUserPassword, getUserById } from '../api/userApi';
import './UserPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaUser, FaTimes } from 'react-icons/fa';

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get userId from navigation state or sessionStorage as fallback
  const userId = location.state?.userId || location.state?.user?.id || sessionStorage.getItem('userId');
  
  console.log('UserPage - userId from location.state:', location.state?.userId);
  console.log('UserPage - userId from sessionStorage:', sessionStorage.getItem('userId'));
  console.log('UserPage - final userId:', userId);
  
  const [user, setUser] = useState({});
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Form states
  const [editFormData, setEditFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    phonenumber: user.phonenumber || ''
  });
  
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRefreshingAccounts, setIsRefreshingAccounts] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      const accounts = await getUserBankAccounts(userId);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    }
  };

  const handleRefreshAccounts = async () => {
    setIsRefreshingAccounts(true);
    await fetchBankAccounts();
    setIsRefreshingAccounts(false);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        setIsUserLoading(true);
        try {
          // Fetch user details
          const userData = await getUserById(userId);
          setUser(userData);
          
          // Initialize edit form with fetched user data
          setEditFormData({
            username: userData.username || '',
            email: userData.email || '',
            phonenumber: userData.phonenumber || ''
          });
          
          // Fetch bank accounts
          await fetchBankAccounts();
        } catch (error) {
          console.error('Error fetching user data:', error);
          setBankAccounts([]);
        } finally {
          setIsUserLoading(false);
        }
      } else {
        // If no userId found, check if user is authenticated but redirect failed
        const token = sessionStorage.getItem('userToken');
        if (token) {
          console.error('User is authenticated but userId is missing. This suggests a session issue.');
          // Clear corrupted session and redirect
          sessionStorage.clear();
        }
        console.warn('No userId found. Redirecting to sign in.');
        navigate('/signin', { replace: true });
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  const handleCreateBankAccount = () => {
    navigate(`/browsebank`, { state: { userId: user.id } });
  };

  const handleEditDetails = () => {
    // Ensure form is populated with latest user data when modal opens
    setEditFormData({
      username: user.username || '',
      email: user.email || '',
      phonenumber: user.phonenumber || ''
    });
    setMessage('');
    setShowEditModal(true);
  };

  const handleChangePassword = () => {
    // Clear password form when modal opens
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage('');
    setShowPasswordModal(true);
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowPasswordModal(false);
    setMessage('');
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const updatedUser = await updateUserDetails(user.id, editFormData);
      setMessage('User details updated successfully!');
      
      // Fetch fresh user data from the API to ensure we have the latest details
      const freshUserData = await getUserById(user.id);
      setUser(freshUserData);
      
      setTimeout(() => {
        closeModals();
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setMessage('Error: New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setMessage('Error: Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const passwordData = {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      };
      
      await changeUserPassword(user.id, passwordData);
      setMessage('Password changed successfully!');
      
      setTimeout(() => {
        closeModals();
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter accounts based on status
  const filteredAccounts = bankAccounts.filter(account => {
    if (statusFilter === 'All') return true;
    return account.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  // Show loading state while user data is being fetched
  if (isUserLoading) {
    return (
      <>
        <Header />
        <div className="userpage-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading user information...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="userpage-container">
        {/* First Part: User Info Row */}
        <div className="user-info-card">
          <div className="user-profile-section">
            <div className="user-avatar">
              <FaUser size={48} />
            </div>
            <div className="user-info">
              <h1 className="user-name">{user.username || 'User'}</h1>
              <p className="user-subtitle">Banking Customer</p>
            </div>
          </div>
          <div className="user-details-grid">
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user.email || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{user.phonenumber || 'N/A'}</span>
            </div>
            <div className="detail-actions">
              <button className="edit-button" onClick={handleEditDetails}>
                Edit Details
              </button>
              <button className="password-button" onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          </div>
          <div className="action-section">
            <button className="create-account-button" onClick={handleCreateBankAccount}>
              <span>+ Create New Account</span>
            </button>
          </div>
        </div>
        {/* Second Part: Accounts List */}
        <div className="accounts-container">
          <div className="accounts-header">
            <h2>Bank Accounts</h2>
            <div className="accounts-controls">
              <button 
                className="refresh-button" 
                onClick={handleRefreshAccounts}
                disabled={isRefreshingAccounts}
                title="Refresh account status"
              >
                {isRefreshingAccounts ? '🔄' : '↻'} {isRefreshingAccounts ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="status-filter">
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select 
                  id="statusFilter"
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
          {filteredAccounts.length === 0 ? (
            <div className="no-accounts">
              {statusFilter === 'All' ? 'No accounts found.' : `No ${statusFilter.toLowerCase()} accounts found.`}
            </div>
          ) : (
            <div className="accounts-list">
              {/* Header Row */}
              <div className="accounts-header-row">
                <span className="account-header-item">Bank</span>
                <span className="account-header-item">Country</span>
                <span className="account-header-item">Status</span>
                <span className="account-header-item">Created Date</span>
              </div>
              
              {/* Scrollable Content */}
              <div className="accounts-content">
                {filteredAccounts.map((account) => (
                  <div key={account.id} className="account-container">
                    <div className="account-info-row">
                      <span className="account-info-item">{account.bank || 'N/A'}</span>
                      <span className="account-info-item">{account.country || 'N/A'}</span>
                      <span className="account-info-item">{account.status || 'N/A'}</span>
                      <span className="account-info-item">{account.createdDate || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Details</h3>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phonenumber">Phone Number</label>
                <input
                  type="tel"
                  id="phonenumber"
                  name="phonenumber"
                  value={editFormData.phonenumber}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              {message && (
                <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
              <div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordFormChange}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordFormChange}
                  required
                  minLength="6"
                />
              </div>
              {message && (
                <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
              <div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default UserPage;
