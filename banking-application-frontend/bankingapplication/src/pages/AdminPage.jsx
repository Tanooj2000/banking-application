import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { fetchAllAccounts, approveAccount, rejectAccount } from '../api/accountApi';
import { updateAdminDetails, changeAdminPassword, getAdminById, updateAdminDetailsSimple } from '../api/adminApi';
import { AuthGuard } from '../utils/authGuard';


const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      console.log('Updated accounts:', newAccounts); // Debug log
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
      // Validate form data
      if (!editFormData.username || !editFormData.email) {
        throw new Error('Username and email are required');
      }

      if (!editFormData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Find the correct admin ID field
      const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
      let actualAdminId = null;
      
      for (const field of possibleIdFields) {
        if (admin[field] && admin[field] !== 'undefined') {
          actualAdminId = admin[field];
          console.log(`Using admin ID from field "${field}":`, actualAdminId);
          break;
        }
      }
      
      if (!actualAdminId) {
        throw new Error('Admin ID not found. Please try logging out and logging back in.');
      }

      let updatedAdmin;
      
      try {
        // Try simple approach first
        console.log('Trying simple update approach with admin ID:', actualAdminId);
        updatedAdmin = await updateAdminDetailsSimple(actualAdminId, {
          username: editFormData.username,
          email: editFormData.email
        });
      } catch (simpleError) {
        console.log('Simple approach failed, trying complex approach...', simpleError.message);
        
        try {
          // Try complex approach with multiple endpoints
          updatedAdmin = await updateAdminDetails(actualAdminId, {
            username: editFormData.username,
            email: editFormData.email
          });
        } catch (complexError) {
          console.error('Both approaches failed:', complexError.message);
          
          // If both fail, show user a helpful message
          setMessage(`Update failed: ${complexError.message}`);
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
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAdminPassword = async () => {
    // Validation
    if (!passwordFormData.currentPassword) {
      setMessage('Current password is required!');
      return;
    }

    if (!passwordFormData.newPassword) {
      setMessage('New password is required!');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setMessage('New passwords do not match!');
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long!');
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
          console.log(`Using admin ID from field "${field}" for password change:`, actualAdminId);
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
      setMessage(`Error: ${error.message}`);
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

  // Debug function to test API connectivity and admin data
  const testApiConnection = async () => {
    console.log('=== ADMIN DEBUG INFO ===');
    console.log('Admin data:', admin);
    console.log('Admin keys:', Object.keys(admin));
    console.log('AdminId value:', admin.adminId);
    console.log('AdminId type:', typeof admin.adminId);
    console.log('Admin id (lowercase):', admin.id);
    console.log('Admin ID (uppercase):', admin.ID);
    console.log('Admin _id:', admin._id);
    console.log('========================');
    
    // Try to determine the correct admin ID field
    const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
    let actualAdminId = null;
    
    for (const field of possibleIdFields) {
      if (admin[field] && admin[field] !== 'undefined') {
        actualAdminId = admin[field];
        console.log(`Found admin ID in field "${field}":`, actualAdminId);
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
      
      console.log('API test response status:', response.status);
      const text = await response.text();
      console.log('API test response:', text);
    } catch (error) {
      console.error('API connection test failed:', error);
      console.log('Make sure your Spring Boot backend is running on port 8083');
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
      await fetch(`http://localhost:8080/account/${accountId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error approving account:', error);
      throw error;
    }
  };

  const rejectAccount = async (accountId) => {
    try {
      await fetch(`http://localhost:8080/account/${accountId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error rejecting account:', error);
      throw error;
    }
  };

  return (
    <>
      <Header />
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          flex: '1',
          overflow: 'hidden'
        }}>
          {/* Admin Info Card - Using UserPage styling */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e8ecef',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '2rem',
            position: 'relative',
            overflow: 'hidden',
            flex: 'none',
            marginBottom: '20px'
          }}>
            {/* Gradient top border */}
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
            }}></div>
            
            {/* Admin Profile Section */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.5rem'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                marginTop: '-8.8px'
              }}>
                {admin.icon || '👨‍💼'}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                justifyContent: 'center',
                minHeight: '120px'
              }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  margin: '0',
                  color: '#2c3e50',
                  letterSpacing: '-0.5px'
                }}>
                  {admin.username ? admin.username.charAt(0).toUpperCase() + admin.username.slice(1) : 'Admin'}
                </h1>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#7f8c8d',
                  margin: '0',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Bank Administrator
                </p>
              </div>
            </div>
            
            {/* Admin Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginTop: '1rem'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Bank Name</span>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  wordWrap: 'break-word',
                  minHeight: '1.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>{admin.bankname || 'N/A'}</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Email</span>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  wordWrap: 'break-word',
                  minHeight: '1.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>{admin.email ? admin.email.charAt(0).toUpperCase() + admin.email.slice(1) : 'N/A'}</span>
              </div>
              
              {/* Edit Actions */}
              <div style={{
                gridColumn: '1 / -1',
                display: 'flex',
                gap: '1rem',
                marginTop: '0.5rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={openEditModal}
                  style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
                    flex: '1',
                    maxWidth: '150px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)';
                  }}
                >
                  Edit Details
                </button>
                
                <button
                  onClick={openPasswordModal}
                  style={{
                    background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(230, 126, 34, 0.3)',
                    flex: '1',
                    maxWidth: '150px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(230, 126, 34, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(230, 126, 34, 0.3)';
                  }}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
          {/* Applications Container */}
          <div style={{ 
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e8ecef',
            flex: '1',
            overflow: 'auto',
            minHeight: '0'
          }}>
            {/* Dynamic header based on filter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2>
                {statusFilter === 'Pending' ? 'Pending Applications' : statusFilter === 'Approved' ? 'Approved Applications' : statusFilter === 'Rejected' ? 'Rejected Applications' : 'Applications'}
              </h2>
              <div>
                <label htmlFor="statusFilter">Filter by Status: </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 4 }}
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
              <div style={{ color: 'red' }}>{error}</div>
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
                <table key={`${statusFilter}-${accounts.length}`} style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Applicant</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Country</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Action</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 12px' }}>{app.applicant || app.fullName}</td>
                        <td style={{ padding: '8px 12px' }}>{app.country || app.location || '-'}</td>
                        <td style={{ padding: '8px 12px' }}>{app.email}</td>
                        <td style={{
                          padding: '8px 12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: app.status?.toLowerCase() === 'pending' ? '#d99a00' : app.status?.toLowerCase() === 'approved' ? '#2e7d32' : '#d32f2f',
                          textAlign: 'left',
                          opacity: processingId === app.id ? 0.5 : 1,
                          transition: 'opacity 0.3s'
                        }}>{app.status}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {app.status?.toLowerCase() === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: processingId ? 'not-allowed' : 'pointer', opacity: processingId === app.id ? 0.6 : 1, transition: 'opacity 0.3s' }}
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
                                style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: processingId ? 'not-allowed' : 'pointer', opacity: processingId === app.id ? 0.6 : 1, transition: 'opacity 0.3s' }}
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
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            title="View more"
                            style={{ 
                              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: '#1976d2',
                              padding: '6px 8px',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                              fontSize: '20px',
                              boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)'
                            }}
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
                onClick={() => setShowEditModal(false)}
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
        </div>
        
        <Footer />
    </>
  );
};

export default AdminPage;