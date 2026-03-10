import React, { useEffect, useState } from 'react';
// Removed BlockedOverlay import as user page no longer hard-blocks after logout
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/accountApi';
import { updateUserDetails, changeUserPassword, getUserById } from '../api/userApi';
import './UserPage.css';
import Footer from '../components/Footer';
import { FaUser, FaTimes, FaEye, FaUserCircle, FaPlus, FaEnvelope, FaQuestionCircle, FaCreditCard, FaSignOutAlt } from 'react-icons/fa';
import { validateGmail, validatePassword, validateName, validateConfirmPassword, validateMobile, getErrorMessage } from '../utils/validation';
import { AuthGuard } from '../utils/authGuard';

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // User blocking after logout has been relaxed per request; allow normal access after re-login

  // Get userId from navigation state or sessionStorage as fallback
  const userId = location.state?.userId || location.state?.user?.id || sessionStorage.getItem('userId');
  

  
  const [user, setUser] = useState({});
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('Profile'); // New state for sidebar navigation
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
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

  const handleLogout = () => {
    // Clear user session and redirect
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    
    // Navigate to home page
    navigate('/', { replace: true });
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

  const handleViewDetails = (account) => {
    setSelectedAccount(account);
    setShowViewModal(true);
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
    setShowViewModal(false);
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
      // Validate form data using new validation functions
      const usernameValidation = validateName(editFormData.username);
      if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.message);
      }

      const emailValidation = validateGmail(editFormData.email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }

      if (editFormData.phonenumber) {
        const phoneValidation = validateMobile(editFormData.phonenumber);
        if (!phoneValidation.isValid) {
          throw new Error(phoneValidation.message);
        }
      }

      const updatedUser = await updateUserDetails(user.id, editFormData);
      setMessage('User details updated successfully!');
      
      // Fetch fresh user data from the API to ensure we have the latest details
      const freshUserData = await getUserById(user.id);
      setUser(freshUserData);
      
      setTimeout(() => {
        closeModals();
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validate using new validation functions
    if (!passwordFormData.currentPassword) {
      setMessage('Current password is required');
      setIsLoading(false);
      return;
    }

    const newPasswordValidation = validatePassword(passwordFormData.newPassword);
    if (!newPasswordValidation.isValid) {
      setMessage(`Error: ${newPasswordValidation.message}`);
      setIsLoading(false);
      return;
    }

    const confirmPasswordValidation = validateConfirmPassword(passwordFormData.newPassword, passwordFormData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      setMessage(`Error: ${confirmPasswordValidation.message}`);
      setIsLoading(false);
      return;
    }

    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setMessage('Error: New password must be different from current password');
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
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter accounts based on status
  const filteredAccounts = bankAccounts.filter(account => {
    if (statusFilter === 'All') return true;
    return account.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'Profile', label: 'Profile', icon: <FaUserCircle /> },
    { id: 'MyAccounts', label: 'My Accounts', icon: <FaCreditCard /> },
    { id: 'CreateAccount', label: 'Create Account', icon: <FaPlus /> },
    { id: 'ContactUs', label: 'Contact Us', icon: <FaEnvelope /> },
    { id: 'FAQ', label: 'FAQ', icon: <FaQuestionCircle /> }
  ];

  // Content components for each section
  const renderProfileContent = () => (
    <div className="content-section">
      <h2 className="section-title">User Profile</h2>
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <FaUser size={60} />
          </div>
          <div className="profile-info">
            <h3>{user.username || 'User'}</h3>
            <p>Banking Customer</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{user.phonenumber || 'N/A'}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="action-btn primary" onClick={handleEditDetails}>
            Edit Details
          </button>
          <button className="action-btn secondary" onClick={handleChangePassword}>
            Change Password
          </button>
          <button className="action-btn logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </div>
  );

  const renderMyAccountsContent = () => (
    <div className="content-section">
      <h2 className="section-title">My Bank Accounts</h2>
      <div className="accounts-controls">
        <button 
          className="refresh-btn" 
          onClick={handleRefreshAccounts}
          disabled={isRefreshingAccounts}
        >
          {isRefreshingAccounts ? '🔄' : '↻'} {isRefreshingAccounts ? 'Refreshing...' : 'Refresh'}
        </button>
        <div className="filter-container">
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
      
      {filteredAccounts.length === 0 ? (
        <div className="no-accounts">
          <div className="no-accounts-icon">🚫</div>
          <p>{statusFilter === 'All' ? 'No accounts found.' : `No ${statusFilter.toLowerCase()} accounts found.`}</p>
        </div>
      ) : (
        <div className="accounts-grid">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="account-card">
              <div className="account-header">
                <h4>{account.bank || 'N/A'}</h4>
                <span className={`status-badge ${account.status?.toLowerCase()}`}>
                  {account.status || 'N/A'}
                </span>
              </div>
              <div className="account-details">
                <p><strong>Country:</strong> {account.country || 'N/A'}</p>
                <p><strong>Branch:</strong> {account.branch || 'N/A'}</p>
                <p><strong>Created:</strong> {account.createdDate || 'N/A'}</p>
                {account.status === 'APPROVED' && account.accountNumber && (
                  <p><strong>Account Number:</strong> {account.accountNumber}</p>
                )}
              </div>
              <button className="view-details-btn" onClick={() => handleViewDetails(account)}>
                <FaEye /> View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateAccountContent = () => (
    <div className="content-section">
      <h2 className="section-title">Create New Account</h2>
      <div className="create-account-content">
        <div className="create-account-info">
          <h3>Ready to open a new bank account?</h3>
          <p>Choose from our selection of banks and start your application process. We support multiple banks across different countries.</p>
          <ul>
            <li>Quick and easy application process</li>
            <li>Multiple account types available</li>
            <li>Secure document upload</li>
            <li>Real-time application status tracking</li>
          </ul>
        </div>
        <button className="create-account-btn" onClick={handleCreateBankAccount}>
          <FaPlus /> Start New Application
        </button>
      </div>
    </div>
  );

  const renderContactUsContent = () => (
    <div className="content-section">
      <h2 className="section-title">Get In Touch</h2>
      <div className="contact-content">
        <div className="contact-grid">
          <div className="contact-card primary">
            <div className="contact-card-icon">
              <FaEnvelope />
            </div>
            <div className="contact-card-content">
              <h4>Email Support</h4>
              <p className="contact-description">Send us your questions</p>
              <p className="contact-detail">noreplyinterbankinghub@gmail.com</p>
              <span className="response-time">Response within 24-48 hours</span>
            </div>
          </div>
        </div>
        
        <div className="contact-tips">
          <h4>💡 Quick Tips</h4>
          <ul>
            <li>Include your account details for faster assistance</li>
            <li>Describe your issue clearly with any error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderFAQContent = () => (
    <div className="content-section">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="faq-content">
        <div className="faq-item">
          <h4>Q: How long does it take to approve my account application?</h4>
          <p>A: Account approval typically takes 1-3 business days. You'll receive email notifications about your application status.</p>
        </div>
        
        <div className="faq-item">
          <h4>Q: What documents do I need to open an account?</h4>
          <p>A: For Indian accounts, you need Aadhaar, PAN, and address proof. For international accounts, requirements vary by country.</p>
        </div>
        
        <div className="faq-item">
          <h4>Q: Can I have multiple accounts with different banks?</h4>
          <p>A: Yes, you can apply for accounts with multiple banks through our platform. Each application is processed independently.</p>
        </div>
        
        <div className="faq-item">
          <h4>Q: How do I check my account status?</h4>
          <p>A: You can check your account status in the "My Accounts" section. We also send email notifications for status updates.</p>
        </div>
        
        <div className="faq-item">
          <h4>Q: What if my application is rejected?</h4>
          <p>A: If your application is rejected, you can contact customer support for details and reapply after addressing any issues.</p>
        </div>
        
        
      </div>
    </div>
  );

  // Function to render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'Profile':
        return renderProfileContent();
      case 'MyAccounts':
        return renderMyAccountsContent();
      case 'CreateAccount':
        return renderCreateAccountContent();
      case 'ContactUs':
        return renderContactUsContent();
      case 'FAQ':
        return renderFAQContent();
      default:
        return renderProfileContent();
    }
  };

  // Show loading state while user data is being fetched
  if (isUserLoading) {
    return (
      <div className="user-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="user-dashboard-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="user-avatar-sidebar">
              <FaUser size={32} />
            </div>
            <div className="user-info-sidebar">
              <h3>{user.username || 'User'}</h3>
              <p>Banking Customer</p>
            </div>
            <button className="logout-btn-sidebar" onClick={handleLogout} title="Logout">
              <FaSignOutAlt size={18} />
            </button>
          </div>
          
          <nav className="sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {renderContent()}
        </div>
      </div>
      {/* View Details Modal */}
      {showViewModal && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
    <div className="modal-content">
        <div className="detail-item">
            <span className="detail-label">Full Name</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.fullName || 'N/A'}</span>
          </div>
          {selectedAccount.status === 'APPROVED' && (
    <div className="detail-item">
      <span className="detail-label">Account Number</span>
      <span className="detail-colon">:</span>
      <span className="detail-value">{selectedAccount.accountNumber || 'N/A'}</span>
    </div>
  )}
          <div className="detail-item">
            <span className="detail-label">Gender</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.gender || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date of Birth</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.dob || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Mobile</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.mobile || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.email || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Address</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.address || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Bank</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.bank || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Branch</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.branch || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Ifsc Code</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.ifscCode || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Account Type</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.accountType || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Deposit</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.deposit || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.status || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Aadhaar</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.aadhaar || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">PAN</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.pan || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Occupation</span>
            <span className="detail-colon">:</span>
            <span className="detail-value">{selectedAccount.occupation || 'N/A'}</span>
          </div>
          
      </div>
          </div>
        </div>
      )}
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
