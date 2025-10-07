import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { fetchAllAccounts, approveAccount, rejectAccount } from '../api/accountApi';
import { testApiConnection } from '../api/adminApi';
import { updateAdminDetails, changeAdminPassword, getAdminById, updateAdminDetailsSimple } from '../api/adminApi';
import { AuthGuard } from '../utils/authGuard';
import { validateGmail, validatePassword, validateName, validateConfirmPassword, getErrorMessage } from '../utils/validation';
import './AdminPage.css';
import { createBranch } from '../api/bankApi';
import { useAuth } from '../context/AuthContext';


const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Early abort: if loggedOut flag present, immediately navigate away (prevents flash on back)
  if (typeof window !== 'undefined' && sessionStorage.getItem('loggedOut') === 'true') {
    // Show a neutral overlay while redirecting to avoid white flash
    setTimeout(() => { try { window.location.replace('/'); } catch(_) {} }, 0);
    return <BlockedOverlay />;
  }

  // Access admin object using AuthGuard
  const [admin, setAdmin] = useState(() => {
    return location.state?.admin || AuthGuard.getAdminData() || {};
  });

  // Store admin data when received
  useEffect(() => {
    if (location.state?.admin) {
      AuthGuard.setAdminData(location.state.admin);
      setAdmin(location.state.admin);
    }
  }, [location.state?.admin]);

  // Check authentication and session validity
  useEffect(() => {
    const checkAuth = () => {
      if (!AuthGuard.isAuthenticated()) {
        AuthGuard.logout();
        return;
      }
    };

    // Check authentication every 5 minutes
    const interval = setInterval(checkAuth, 5 * 60 * 1000);
    
    // Initial check
    checkAuth();

    return () => clearInterval(interval);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!AuthGuard.isAuthenticated()) {
      AuthGuard.logout();
    }
  }, []);

  // State for all applications
  const [accounts, setAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null); // for animation/feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null); // for modal
  
  // Modal states for admin edit functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Form states for admin edit
  const [editFormData, setEditFormData] = useState({
    username: admin.username || '',
    email: admin.email || ''
  });
  
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Branch creation states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    country: admin.country || 'India', // Default to 'India' if admin.country is empty
    city: '',
    bankName: admin.bankname || '',
    branch: '',
    code: ''
  });
  const [isBranchLoading, setIsBranchLoading] = useState(false);
  const [branchMessage, setBranchMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!admin.bankname) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const fetchedAccounts = await fetchAllAccounts(admin.bankname);
        setAccounts(fetchedAccounts);
      } catch (err) {
        setAccounts([]); // Set accounts to an empty array instead of showing an error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [admin.bankname]);

  // Helper to update account status and move between lists instantly
  const updateAccountStatus = (id, newStatus) => {
    setAccounts(prev => {
      const newAccounts = prev.map(a => a.id === id ? { ...a, status: newStatus } : a);

      return newAccounts;
    });
  };

  // Prevent browser back navigation to admin pages
  useEffect(() => {
    const cleanup = AuthGuard.preventBackNavigation();
    return cleanup;
  }, []);

  // Admin edit functions
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateAdminDetails = async () => {
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

      // Find the correct admin ID field
      const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
      let actualAdminId = null;
      
      for (const field of possibleIdFields) {
        if (admin[field] && admin[field] !== 'undefined') {
          actualAdminId = admin[field];

          break;
        }
      }
      
      if (!actualAdminId) {
        throw new Error('Admin ID not found. Please try logging out and logging back in.');
      }

      let updatedAdmin;
      
      try {
        // Try simple approach first

        updatedAdmin = await updateAdminDetailsSimple(actualAdminId, {
          username: editFormData.username,
          email: editFormData.email
        });
      } catch (simpleError) {

        
        try {
          // Try complex approach with multiple endpoints
          updatedAdmin = await updateAdminDetails(actualAdminId, {
            username: editFormData.username,
            email: editFormData.email
          });
        } catch (complexError) {
          console.error('Both approaches failed:', complexError.message);
          
          // If both fail, show user a helpful message
          setMessage(`Update failed: ${getErrorMessage(complexError)}`);
          return;
        }
      }
      
      // Update sessionStorage and local state
      const updatedAdminData = { 
        ...admin, 
        username: editFormData.username, 
        email: editFormData.email 
      };
      sessionStorage.setItem('adminData', JSON.stringify(updatedAdminData));
      setAdmin(updatedAdminData);
      
      setMessage('Details updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error updating admin details:', error);
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAdminPassword = async () => {
    // Validation using new validation functions
    if (!passwordFormData.currentPassword) {
      setMessage('Current password is required!');
      return;
    }

    const newPasswordValidation = validatePassword(passwordFormData.newPassword);
    if (!newPasswordValidation.isValid) {
      setMessage(newPasswordValidation.message);
      return;
    }

    const confirmPasswordValidation = validateConfirmPassword(passwordFormData.newPassword, passwordFormData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      setMessage(confirmPasswordValidation.message);
      return;
    }

    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setMessage('New password must be different from current password!');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      // Find the correct admin ID field
      const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
      let actualAdminId = null;
      
      for (const field of possibleIdFields) {
        if (admin[field] && admin[field] !== 'undefined') {
          actualAdminId = admin[field];

          break;
        }
      }
      
      if (!actualAdminId) {
        throw new Error('Admin ID not found. Please try logging out and logging back in.');
      }

      const passwordData = {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      };

      // Use the correct API method that matches backend exactly
      await changeAdminPassword(actualAdminId, passwordData);
      
      setMessage('Password updated successfully!');
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      username: admin.username || '',
      email: admin.email || ''
    });
    setMessage('');
    setShowEditModal(true);
  };

  const openPasswordModal = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage('');
    setShowPasswordModal(true);
  };

  // Branch creation functions
  const handleBranchFormChange = (e) => {
    const { name, value } = e.target;
    setBranchFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateBranch = async () => {
    setIsBranchLoading(true);
    setBranchMessage('');

    try {
      console.log('Admin object:', admin);
      console.log('Branch form data:', branchFormData);
      // Validation
      if (!branchFormData.country || !branchFormData.city || !branchFormData.branch || !branchFormData.code) {
        throw new Error('All fields are required');
      }

      if (branchFormData.code.length < 3) {
        throw new Error('Branch code must be at least 3 characters long');
      }


      // Call the API to create branch
      const result = await createBranch(branchFormData);

      setBranchMessage('Branch created successfully!');
      setBranchFormData({
        country: admin.country || '', // Default to 'India' if admin.country is empty
        city: '',
        bankName: admin.bankname || '',
        branch: '',
        code: ''
      });

      setTimeout(() => {
        setShowBranchModal(false);
        setBranchMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error creating branch:', error);
      setBranchMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsBranchLoading(false);
    }
  };

  const openBranchModal = () => {
    setBranchFormData({
      country: admin.country || 'India', // Default to 'India' if admin.country is empty
      city: '',
      bankName: admin.bankname || '',
      branch: '',
      code: ''
    });
    setBranchMessage('');
    setShowBranchModal(true);
  };

  // Call test on component mount (optional - remove in production)
  useEffect(() => {
    if (admin.adminId) {
      testApiConnection();
    }
  }, [admin.adminId]);

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    navigate('/signin', { replace: true });
    return null;
  }

  return (
    <>
      <Header />
      <div className="admin-page-container">
        <div className="admin-content">
          {/* Admin Info Card */}
          <div className="admin-profile-section">
            {/* Gradient top border */}
            <div className="gradient-border"></div>
            
            {/* Admin Profile Section */}
            <div className="admin-profile">
              <div className="admin-avatar">
                {admin.icon || '👨‍💼'}
              </div>
              <div className="admin-info">
                <h1 className="admin-name">
                  {admin.username ? admin.username.charAt(0).toUpperCase() + admin.username.slice(1) : 'Admin'}
                </h1>
                <p className="admin-role">
                  Bank Administrator
                </p>
              </div>
            </div>
            
            {/* Admin Details Grid */}
            <div className="admin-details-grid">
              <div className="admin-detail-card">
                <span className="detail-label">Bank Name</span>
                <span className="detail-value">{admin.bankname || 'N/A'}</span>
              </div>
              
              <div className="admin-detail-card">
                <span className="detail-label">Email</span>
                <span className="detail-value">{admin.email ? admin.email.charAt(0).toUpperCase() + admin.email.slice(1) : 'N/A'}</span>
              </div>
              
              {/* Edit Actions */}
              <div className="admin-actions">
                <button onClick={openEditModal} className="action-btn edit-btn">
                  Edit Details
                </button>
                
                <button onClick={openPasswordModal} className="action-btn password-btn">
                  Reset Password
                </button>

                <button onClick={openBranchModal} className="action-btn branch-btn">
                  <span>+ Add New Branch</span>
                </button>
              </div>
            </div>
          </div>
          {/* Applications Container */}
          <div className="applications-container">
            {/* Dynamic header based on filter */}
            <div className="applications-header">
              <h2>
                {statusFilter === 'Pending' ? 'Pending Applications' : statusFilter === 'Approved' ? 'Approved Applications' : statusFilter === 'Rejected' ? 'Rejected Applications' : 'Applications'}
              </h2>
              <div className="filter-section">
                <label htmlFor="statusFilter">Filter by Status: </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="All">All</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div>Loading applications...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (() => {
              // Filter accounts based on status
              // Filter is case-sensitive and matches backend status exactly
              const filteredAccounts = accounts.filter(acc =>
                statusFilter === 'All'
                  ? true
                  : (acc.status || '').toLowerCase() === statusFilter.toLowerCase()
              );
              return filteredAccounts.length === 0 ? (
                <div className="no-applications">
                  <div className="no-applications-icon">🚫</div>
                  <h2>No {statusFilter} Applications</h2>
                  <p>There are currently no {statusFilter.toLowerCase()} applications to review.</p>
                </div>
              ) : (
                <table key={`${statusFilter}-${accounts.length}`} className="applications-table">
                  <thead>
                    <tr className="table-header">
                      <th>Applicant</th>
                      <th>Country</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Action</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map(app => (
                      <tr key={app.id} className="table-row">
                        <td>{app.applicant || app.fullName}</td>
                        <td>{app.country || app.location || '-'}</td>
                        <td>{app.email}</td>
                        <td className={`status-cell ${app.status?.toLowerCase() === 'pending' ? 'status-pending' : app.status?.toLowerCase() === 'approved' ? 'status-approved' : 'status-rejected'}`}
                            style={{
                              opacity: processingId === app.id ? 0.5 : 1,
                              transition: 'opacity 0.3s'
                            }}>{app.status}</td>
                        <td>
                          {app.status?.toLowerCase() === 'pending' ? (
                            <div className="action-buttons">
                              <button
                                className="approve-btn"
                                style={{ opacity: processingId === app.id ? 0.6 : 1, transition: 'opacity 0.3s' }}
                                disabled={!!processingId}
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to approve this account?')) {
                                    setProcessingId(app.id);
                                    setSuccessMsg("");
                                    try {
                                      await approveAccount(app.id);
                                      setSuccessMsg('approved:Account approved successfully!');
                                      updateAccountStatus(app.id, 'Approved'); // Use exact status string
                                      setProcessingId(null);
                                      setTimeout(() => setSuccessMsg(""), 2000);
                                    } catch (err) {
                                      setProcessingId(null);
                                      alert('Failed to approve account');
                                    }
                                  }
                                }}
                              >
                                {processingId === app.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                className="reject-btn"
                                style={{ opacity: processingId === app.id ? 0.6 : 1, transition: 'opacity 0.3s' }}
                                disabled={!!processingId}
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to reject this account?')) {
                                    setProcessingId(app.id);
                                    setSuccessMsg("");
                                    try {
                                      await rejectAccount(app.id);
                                      setSuccessMsg('rejected:Account rejected successfully!');
                                      updateAccountStatus(app.id, 'Rejected'); // Use exact status string
                                      setProcessingId(null);
                                      setTimeout(() => setSuccessMsg(""), 2000);
                                    } catch (err) {
                                      setProcessingId(null);
                                      alert('Failed to reject account');
                                    }
                                  }
                                }}
                              >
                                {processingId === app.id ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <button
                            title="View more"
                            className="view-more-btn"
                            onMouseEnter={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)';
                              e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
                              e.target.style.transform = 'scale(1)';
                            }}
                            onClick={() => setSelectedAccount(app)}
                          >
                            👁
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
            {successMsg && (
              <div className={`success-message ${successMsg.startsWith('rejected:') ? 'error' : ''}`}>
                {successMsg.replace(/^(approved:|rejected:)/, '')}
              </div>
            )}
          </div>
        </div>
        
        {/* Modal for Account Details */}
        {selectedAccount && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button
                onClick={() => setSelectedAccount(null)}
                className="modal-close-btn"
              >
                ✕
              </button>
              
              <h2 className="modal-title">
                Account Details
              </h2>
              
              <div className="modal-grid">
                <div>
                  <strong>Account ID:</strong>
                  <div className="modal-grid-item">{selectedAccount.id || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Full Name:</strong>
                  <div className="modal-grid-item">{selectedAccount.fullName || selectedAccount.applicant || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Email:</strong>
                  <div className="modal-grid-item">{selectedAccount.email || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Phone:</strong>
                  <div className="modal-grid-item">{selectedAccount.mobile || selectedAccount.phoneNumber || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Country:</strong>
                  <div className="modal-grid-item">{selectedAccount.country || selectedAccount.location || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Bank:</strong>
                  <div className="modal-grid-item">{selectedAccount.bank || selectedAccount.bankName || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Account Type:</strong>
                  <div className="modal-grid-item">{selectedAccount.accountType || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Status:</strong>
                  <div className={`modal-grid-item status ${selectedAccount.status?.toLowerCase()}`}>
                    {selectedAccount.status || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <strong>Date Applied:</strong>
                  <div className="modal-grid-item">{selectedAccount.dateApplied || selectedAccount.createdDate || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Address:</strong>
                  <div className="modal-grid-item">{selectedAccount.address || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Date of Birth:</strong>
                  <div className="modal-grid-item">{selectedAccount.dateOfBirth || selectedAccount.dob || 'N/A'}</div>
                </div>
                
                <div>
                  <strong>Initial Deposit:</strong>
                  <div className="modal-grid-item">{selectedAccount.initialDeposit || selectedAccount.deposit || 'N/A'}</div>
                </div>
              </div>
              
              {selectedAccount.notes && (
                <div className="modal-notes">
                  <strong>Notes:</strong>
                  <div className="modal-notes-content">{selectedAccount.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Edit Admin Details Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={() => setShowEditModal(false)} className="modal-close-btn">✕</button>
              <h2 className="modal-title">Edit Admin Details</h2>
              {message && (
                <div className={`success-message ${message.includes('Error') ? 'error' : ''}`}>
                  {message}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAdminDetails(); }} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Username: <span className="required">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditFormChange}
                    required
                    className="form-input"
                    placeholder="Enter your username"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email: <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    required
                    className="form-input"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name:</label>
                  <input
                    type="text"
                    value={admin.bankname || ''}
                    disabled
                    className="form-input readonly"
                  />
                  <small className="disabled-note">Bank name cannot be changed</small>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowEditModal(false)} className="form-btn cancel">Cancel</button>
                  <button type="submit" disabled={isLoading} className="form-btn submit">
                    {isLoading ? 'Updating...' : 'Update Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Reset Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={() => setShowPasswordModal(false)} className="modal-close-btn">✕</button>
              <h2 className="modal-title">Reset Password</h2>
              {message && (
                <div className={`success-message ${message.includes('Error') ? 'error' : ''}`}>
                  {message}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAdminPassword(); }} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Current Password: <span className="required">*</span></label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordFormChange}
                    required
                    className="form-input"
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password: <span className="required">*</span></label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordFormChange}
                    required
                    minLength="6"
                    className="form-input"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  {passwordFormData.newPassword && passwordFormData.newPassword.length < 6 && (
                    <small className="disabled-note">Password must be at least 6 characters long</small>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password: <span className="required">*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordFormChange}
                    required
                    className="form-input"
                    placeholder="Confirm your new password"
                  />
                  {passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword && (
                    <small className="disabled-note">Passwords do not match</small>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="form-btn cancel">Cancel</button>
                  <button type="submit" disabled={isLoading} className="form-btn submit">
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Branch Modal */}
        {showBranchModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={() => setShowBranchModal(false)} className="modal-close-btn">×</button>
              <h2 className="modal-title">Add New Branch</h2>
              {branchMessage && (
                <div className={`success-message ${branchMessage.includes('Error') ? 'error' : ''}`}>
                  {branchMessage}
                </div>
              )}
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateBranch();
              }} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Country <span className="required">*</span></label>
                  <input
                    type="text"
                    name="country"
                    value={admin.country || ''}
                    className="form-input readonly"
                    placeholder="Enter country name"
                    required
                    style={{ pointerEvents: 'none' }}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">City <span className="required">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={branchFormData.city}
                    onChange={handleBranchFormChange}
                    className="form-input"
                    placeholder="Enter city name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="bankName"
                    value={admin.bankname || ''}
                    className="form-input readonly"
                    placeholder="Bank name"
                    readOnly
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Branch Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="branch"
                    value={branchFormData.branch}
                    onChange={handleBranchFormChange}
                    className="form-input"
                    placeholder="Enter branch name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Branch Code <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={branchFormData.code}
                    onChange={handleBranchFormChange}
                    className="form-input"
                    placeholder="Enter branch code (min 3 characters)"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setShowBranchModal(false)} className="form-btn cancel">Cancel</button>
                  <button type="submit" disabled={isBranchLoading} className="form-btn submit">
                    {isBranchLoading ? 'Creating...' : 'Create Branch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
        
        <Footer />
    </>
  );
};

export default AdminPage;