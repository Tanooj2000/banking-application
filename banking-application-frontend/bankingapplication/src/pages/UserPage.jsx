import React, { useEffect, useState } from 'react';
// Removed BlockedOverlay import as user page no longer hard-blocks after logout
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserBankAccounts } from '../api/accountApi';
import { updateUserDetails, changeUserPassword, getUserById } from '../api/userApi';
import './UserPageClean.css';
import Footer from '../components/Footer';
import { FaUser, FaTimes, FaEye, FaUserCircle, FaPlus, FaEnvelope, FaQuestionCircle, FaCreditCard, FaSignOutAlt } from 'react-icons/fa';
import { validateGmail, validatePassword, validateName, validateConfirmPassword, validateMobile, getErrorMessage } from '../utils/validation';
import { AuthGuard } from '../utils/authGuard';

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // User blocking after logout has been relaxed per request; allow normal access after re-login

  // Get current user from JWT stored in localStorage
  const currentUser = AuthGuard.getCurrentUser();
  const userId = currentUser?.id || currentUser?.userId || location.state?.userId || location.state?.user?.id;
  

  
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
        // No userId — check if actually authenticated
        if (AuthGuard.isAuthenticated()) {
          console.error('User is authenticated but userId is missing. This suggests a session issue.');
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

  // Enhanced Sidebar navigation items with professional styling
  const sidebarItems = [
    { id: 'Profile', label: 'My Profile', icon: <FaUserCircle /> },
    { id: 'MyAccounts', label: 'Bank Accounts', icon: <FaCreditCard /> },
    { id: 'CreateAccount', label: 'New Account', icon: <FaPlus /> },
    { id: 'ContactUs', label: 'Support', icon: <FaEnvelope /> },
    { id: 'FAQ', label: 'Help Center', icon: <FaQuestionCircle /> }
  ];

  // Content components for each section with enhanced professional styling
  const renderProfileContent = () => (
    <div className="content-section profile-section">
      <h2 className="section-title">User <em>Profile</em></h2>
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <FaUser size={40} />
          </div>
          <div className="profile-info">
            <h3>{user.username || 'User'}</h3>
            <p>Professional Banking Customer</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Email Address:</span>
            <span className="detail-value">{user.email || 'Not Available'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone Number:</span>
            <span className="detail-value">{user.phonenumber || 'Not Available'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Account Status:</span>
            <span className="detail-value" style={{ color: 'var(--gold)', fontWeight: '500' }}>Active</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Member Since:</span>
            <span className="detail-value">2024</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="action-btn primary" onClick={handleEditDetails}>
            <FaUser /> Edit Details
          </button>
          <button className="action-btn secondary" onClick={handleChangePassword}>
            🔐 Change Password
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
      <h2 className="section-title">My Bank <em>Accounts</em></h2>
      <div className="accounts-controls">
        <button 
          className="refresh-btn" 
          onClick={handleRefreshAccounts}
          disabled={isRefreshingAccounts}
        >
          {isRefreshingAccounts ? '🔄' : '↻'} {isRefreshingAccounts ? 'Refreshing...' : 'Refresh Accounts'}
        </button>
        <div className="filter-container">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select 
            id="statusFilter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Accounts</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      {filteredAccounts.length === 0 ? (
        <div className="no-accounts">
          <div className="no-accounts-icon">🏦</div>
          <h3>No Banking Accounts Found</h3>
          <p>{statusFilter === 'All' ? 'You haven\'t created any bank accounts yet.' : `No ${statusFilter.toLowerCase()} accounts found.`}</p>
        </div>
      ) : (
        <div className="accounts-grid">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="account-card">
              <div className="account-header">
                <h4>🏛️ {account.bank || 'Bank Name Not Available'}</h4>
                <span className={`status-badge ${account.status?.toLowerCase()}`}>
                  {account.status || 'Unknown'}
                </span>
              </div>
              <div className="account-details">
                <p><strong>🌍 Country:</strong> {account.country || 'Not Specified'}</p>
                <p><strong>🏢 Branch:</strong> {account.branch || 'Not Specified'}</p>
                <p><strong>📅 Created:</strong> {account.createdDate || 'Not Available'}</p>
                {account.status === 'APPROVED' && account.accountNumber && (
                  <p><strong>💳 Account Number:</strong> {account.accountNumber}</p>
                )}
              </div>
              <button className="view-details-btn" onClick={() => handleViewDetails(account)}>
                <FaEye /> View Full Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateAccountContent = () => (
    <div className="content-section">
      <h2 className="section-title">Create New <em>Account</em></h2>
      <div className="create-account-content">
        <div className="create-account-header">
          <h3>Open a New Bank Account</h3>
          <p>Access our network of partner banks and start your application process.</p>
        </div>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-label">Quick Application</span>
            <span className="feature-description">Complete in minutes</span>
          </div>
          <div className="feature-item">
            <span className="feature-label">Global Network</span>
            <span className="feature-description">Multiple countries available</span>
          </div>
          <div className="feature-item">
            <span className="feature-label">Secure Process</span>
            <span className="feature-description">Bank-grade security</span>
          </div>
          <div className="feature-item">
            <span className="feature-label">Real-time Updates</span>
            <span className="feature-description">Track your progress</span>
          </div>
        </div>
        
        <div className="create-account-action">
          <button className="create-account-btn" onClick={handleCreateBankAccount}>
            <FaPlus /> Start Application
          </button>
        </div>
      </div>
    </div>
  );

  const renderContactUsContent = () => (
    <div className="content-section">
      <h2 className="section-title">Get In <em>Touch</em></h2>
      <div className="contact-content">
        <div className="contact-grid">
          <div className="contact-card primary">
            <div className="contact-card-icon">
              <FaEnvelope />
            </div>
            <div className="contact-card-content">
              <h4>📧 Professional Email Support</h4>
              <p className="contact-description">Send us your questions and we'll provide comprehensive assistance</p>
              <p className="contact-detail">noreplyinterbankinghub@gmail.com</p>
              <span className="response-time">⏱️ Professional response within 24-48 hours</span>
            </div>
          </div>
        </div>
        
        <div className="contact-tips">
          <h4>💡 Professional Support Tips</h4>
          <ul>
            <li>📋 Include your account details and user ID for faster assistance</li>
            <li>🔍 Describe your issue clearly with any error messages or screenshots</li>
            <li>📞 For urgent matters, mention "URGENT" in your email subject line</li>
            <li>🏦 For bank-specific queries, include the bank name and branch details</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderFAQContent = () => (
    <div className="content-section">
      <h2 className="section-title">Frequently Asked <em>Questions</em></h2>
      <div className="faq-content">
        <div className="faq-item">
          <h4>⏱️ How long does it take to approve my account application?</h4>
          <p><strong>Answer:</strong> Account application processing typically takes 1-3 business days depending on the bank and country. You'll receive comprehensive email notifications throughout the review process, including status updates and any additional documentation requirements.</p>
        </div>
        
        <div className="faq-item">
          <h4>📋 What documents do I need to open a bank account?</h4>
          <p><strong>Answer:</strong> Documentation requirements vary by country and bank type. For Indian accounts, you typically need Aadhaar card, PAN card, and address proof. For international accounts, passport, visa documentation, and local address verification may be required. Our platform guides you through the specific requirements for each bank.</p>
        </div>
        
        <div className="faq-item">
          <h4>🏦 Can I have multiple accounts with different banks?</h4>
          <p><strong>Answer:</strong> Absolutely! Our platform is designed to support multi-bank relationships. You can apply for accounts with multiple banks through our unified interface. Each application is processed independently, allowing you to diversify your banking portfolio across different institutions and countries.</p>
        </div>
        
        <div className="faq-item">
          <h4>📱 How do I check my account application status?</h4>
          <p><strong>Answer:</strong> You can monitor all your applications in real-time through the "My Accounts" section. Our dashboard provides comprehensive status tracking, including application progress, approval stages, and any required actions. Additionally, we send automated email notifications for all status changes.</p>
        </div>
        
        <div className="faq-item">
          <h4>❌ What happens if my application is rejected?</h4>
          <p><strong>Answer:</strong> If your application is not approved, our customer support team will provide detailed feedback on the reasons and guidance for improvement. You can contact our support team for personalized assistance and reapply once you've addressed any identified issues. We're committed to helping you succeed in your banking journey.</p>
        </div>
        
        <div className="faq-item">
          <h4>🔒 How secure is the application process?</h4>
          <p><strong>Answer:</strong> We employ bank-grade security measures including SSL encryption, secure document storage, and compliance with international data protection standards. Your personal and financial information is protected throughout the entire application lifecycle.</p>
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

  // Enhanced loading state while user data is being fetched
  if (isUserLoading) {
    return (
      <div className="user-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your banking dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="user-dashboard-container">
        {/* Enhanced Professional Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="user-avatar-sidebar">
              <FaUser size={24} />
            </div>
            <div className="user-info-sidebar">
              <h3>{user.username || 'Professional User'}</h3>
              <p>Banking Dashboard</p>
            </div>
            <button className="logout-btn-sidebar" onClick={handleLogout} title="Secure Logout">
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

        {/* Enhanced Professional Main Content Area */}
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
                  value={editFormData.username || ''}
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
                  value={editFormData.email || ''}
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
                  value={editFormData.phonenumber || ''}
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
                  value={passwordFormData.currentPassword || ''}
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
                  value={passwordFormData.newPassword || ''}
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
                  value={passwordFormData.confirmPassword || ''}
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
