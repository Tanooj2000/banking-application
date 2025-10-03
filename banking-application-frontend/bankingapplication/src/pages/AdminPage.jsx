import React, { useEffect, useState } from 'react';
import BlockedOverlay from '../components/BlockedOverlay';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { fetchAllAccounts } from '../api/accountApi';
import { updateAdminDetails, changeAdminPassword, getAdminById, updateAdminDetailsSimple } from '../api/adminApi';
import { AuthGuard } from '../utils/authGuard';
import { validateGmail, validatePassword, validateName, validateConfirmPassword, getErrorMessage } from '../utils/validation';
import './AdminPage.css';


const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    country: '',
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
        setError(err.message || 'Failed to fetch accounts');
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
      // Validation
      if (!branchFormData.country || !branchFormData.city || !branchFormData.branch || !branchFormData.code) {
        throw new Error('All fields are required');
      }

      if (branchFormData.code.length < 3) {
        throw new Error('Branch code must be at least 3 characters long');
      }

      // API call to create branch
      const response = await fetch('http://localhost:8082/api/banks/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchFormData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create branch');
      }

      const result = await response.json();

      setBranchMessage('Branch created successfully!');
      setBranchFormData({
        country: '',
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
      country: '',
      city: '',
      bankName: admin.bankname || '',
      branch: '',
      code: ''
    });
    setBranchMessage('');
    setShowBranchModal(true);
  };

  // Debug function to test API connectivity and admin data
  const testApiConnection = async () => {
    // Try to determine the correct admin ID field
    const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
    let actualAdminId = null;
    
    for (const field of possibleIdFields) {
      if (admin[field] && admin[field] !== 'undefined') {
        actualAdminId = admin[field];
        break;
      }
    }
    
    if (!actualAdminId) {
      console.error('No valid admin ID found in admin data!');
      setMessage('Error: Admin ID not found. Please try logging out and logging back in.');
      return;
    }
    
    try {
      // Test basic connectivity
      const response = await fetch('http://localhost:8083/api/admin/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      await response.text();
    } catch (error) {
      console.error('API connection test failed:', error);
    }
  };

  // Call test on component mount (optional - remove in production)
  useEffect(() => {
    if (admin.adminId) {
      testApiConnection();
    }
  }, [admin.adminId]);

  // Define approve and reject functions inline
  const approveAccount = async (accountId) => {
    try {
      const url = `http://localhost:8085/accounts/approve/${accountId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to approve account:', errorText);
        throw new Error(`Failed to approve account: ${response.status} - ${errorText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error approving account:', error);
      throw error;
    }
  };

  const rejectAccount = async (accountId) => {
    try {
      const url = `http://localhost:8085/accounts/reject/${accountId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to reject account:', errorText);
        throw new Error(`Failed to reject account: ${response.status} - ${errorText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error rejecting account:', error);
      throw error;
    }
  };

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
                <div>No {statusFilter.toLowerCase()} applications.</div>
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
              <div style={{
                position: 'fixed',
                top: 80,
                right: 40,
                background: successMsg.startsWith('approved:') ? '#43a047' : successMsg.startsWith('rejected:') ? '#d32f2f' : '#43a047',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1.1rem',
                boxShadow: '0 2px 12px rgba(60,60,60,0.18)',
                zIndex: 9999,
                transition: 'opacity 0.4s',
                opacity: 0.95
              }}>
                {successMsg.replace(/^(approved:|rejected:)/, '')}
              </div>
            )}
          </div>
        </div>
        
        {/* Modal for Account Details */}
        {selectedAccount && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80%',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
              
              <h2 style={{ 
                marginBottom: '24px', 
                color: '#1976d2',
                borderBottom: '2px solid #e3f2fd',
                paddingBottom: '12px'
              }}>
                Account Details
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <strong style={{ color: '#333' }}>Account ID:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.id || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Full Name:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.fullName || selectedAccount.applicant || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Email:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.email || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Phone:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.mobile || selectedAccount.phoneNumber || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Country:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.country || selectedAccount.location || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Bank:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.bank || selectedAccount.bankName || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Account Type:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.accountType || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Status:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    color: selectedAccount.status?.toLowerCase() === 'pending' ? '#d99a00' : selectedAccount.status?.toLowerCase() === 'approved' ? '#2e7d32' : '#d32f2f',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {selectedAccount.status || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Date Applied:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.dateApplied || selectedAccount.createdDate || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Address:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.address || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Date of Birth:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.dateOfBirth || selectedAccount.dob || 'N/A'}</div>
                </div>
                
                <div>
                  <strong style={{ color: '#333' }}>Initial Deposit:</strong>
                  <div style={{ marginTop: '4px', color: '#666' }}>{selectedAccount.initialDeposit || selectedAccount.deposit || 'N/A'}</div>
                </div>
              </div>
              
              {selectedAccount.notes && (
                <div style={{ marginTop: '20px' }}>
                  <strong style={{ color: '#333' }}>Notes:</strong>
                  <div style={{ marginTop: '8px', color: '#666', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    {selectedAccount.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Edit Admin Details Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={() => setShowEditModal(false)} className="modal-close-btn">
                ✕
              </button>
              
              <h2 className="modal-title">
                Edit Admin Details
              </h2>
              
              {message && (
                <div style={{
                  padding: '12px',
                  marginBottom: '16px',
                  borderRadius: '6px',
                  background: message.includes('Error') ? '#ffebee' : '#e8f5e8',
                  color: message.includes('Error') ? '#d32f2f' : '#2e7d32',
                  border: `1px solid ${message.includes('Error') ? '#ffcdd2' : '#c8e6c9'}`
                }}>
                  {message}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAdminDetails(); }} style={{ width: '100%' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Username: <span style={{ color: '#d32f2f' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${!editFormData.username && message.includes('required') ? '#d32f2f' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter your username"
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Email: <span style={{ color: '#d32f2f' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${(!editFormData.email || !editFormData.email.includes('@')) && message.includes('email') ? '#d32f2f' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter your email address"
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#999' }}>
                    Bank Name:
                  </label>
                  <input
                    type="text"
                    value={admin.bankname || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #f0f0f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: '#f9f9f9',
                      color: '#999',
                      cursor: 'not-allowed'
                    }}
                  />
                  <small style={{ color: '#999', fontSize: '12px' }}>Bank name cannot be changed</small>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      background: isLoading ? '#ccc' : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {isLoading ? 'Updating...' : 'Update Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Reset Password Modal */}
        {showPasswordModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
              
              <h2 style={{ 
                marginBottom: '24px', 
                color: '#388e3c',
                borderBottom: '2px solid #e8f5e8',
                paddingBottom: '12px'
              }}>
                Reset Password
              </h2>
              
              {message && (
                <div style={{
                  padding: '12px',
                  marginBottom: '16px',
                  borderRadius: '6px',
                  background: message.includes('Error') ? '#ffebee' : '#e8f5e8',
                  color: message.includes('Error') ? '#d32f2f' : '#2e7d32',
                  border: `1px solid ${message.includes('Error') ? '#ffcdd2' : '#c8e6c9'}`
                }}>
                  {message}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAdminPassword(); }} style={{ width: '100%' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Current Password: <span style={{ color: '#d32f2f' }}>*</span>
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${!passwordFormData.currentPassword && message.includes('Current password') ? '#d32f2f' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#388e3c'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    New Password: <span style={{ color: '#d32f2f' }}>*</span>
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordFormChange}
                    required
                    minLength="6"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${(passwordFormData.newPassword && passwordFormData.newPassword.length < 6) || (!passwordFormData.newPassword && message.includes('New password')) ? '#d32f2f' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#388e3c'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  {passwordFormData.newPassword && passwordFormData.newPassword.length < 6 && (
                    <small style={{ color: '#d32f2f', fontSize: '12px' }}>Password must be at least 6 characters long</small>
                  )}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Confirm New Password: <span style={{ color: '#d32f2f' }}>*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${(passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword) ? '#d32f2f' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#388e3c'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Confirm your new password"
                  />
                  {passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword && (
                    <small style={{ color: '#d32f2f', fontSize: '12px' }}>Passwords do not match</small>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      background: isLoading ? '#ccc' : 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Branch Modal */}
        {showBranchModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowBranchModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
              
              <h2 style={{ 
                marginTop: '0',
                marginBottom: '24px',
                fontSize: '24px',
                fontWeight: '600',
                color: '#333'
              }}>
                Add New Branch
              </h2>

              {branchMessage && (
                <div style={{
                  position: 'fixed',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: branchMessage.includes('Error') ? '#f44336' : '#43a047',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 10001,
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {branchMessage}
                </div>
              )}
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateBranch();
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={branchFormData.country}
                    onChange={handleBranchFormChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter country name"
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={branchFormData.city}
                    onChange={handleBranchFormChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter city name"
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={branchFormData.bankName}
                    onChange={handleBranchFormChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s',
                      outline: 'none',
                      backgroundColor: '#f9f9f9'
                    }}
                    placeholder="Bank name"
                    readOnly
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={branchFormData.branch}
                    onChange={handleBranchFormChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter branch name"
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={branchFormData.code}
                    onChange={handleBranchFormChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Enter branch code (min 3 characters)"
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isBranchLoading}
                    style={{
                      background: isBranchLoading ? '#ccc' : 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      cursor: isBranchLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
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