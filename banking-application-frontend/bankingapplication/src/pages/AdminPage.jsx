import React, { useEffect, useState } from 'react';
import BlockedOverlay from '../components/BlockedOverlay';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { fetchAllAccounts, approveAccount, rejectAccount } from '../api/accountApi';
import { updateAdminDetails, changeAdminPassword, getAdminById, updateAdminDetailsSimple } from '../api/adminApi';
import { AuthGuard } from '../utils/authGuard';
import { validateGmail, validatePassword, validateName, validateConfirmPassword, getErrorMessage } from '../utils/validation';
import './AdminPageClean.css';
import { createBranch } from '../api/bankApi';
import { FaUser, FaTimes, FaEye, FaUserShield, FaPlus, FaChartBar, FaBuilding, FaSignOutAlt, FaUsers, FaEdit, FaKey } from 'react-icons/fa';
import { HiSun, HiMoon } from 'react-icons/hi';


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

  const adminIdResolved = admin.adminId || admin.id || admin.ID || admin._id || admin.admin_id;
  const adminName = admin.username || admin.userName || admin.name || admin.adminName || '';
  const adminEmail = admin.email || admin.mail || admin.emailAddress || '';
  const adminBankName = admin.bankname || admin.bankName || admin.bank || admin.bank_name || '';
  const adminCountry = admin.country || admin.countryName || admin.locationCountry || '';

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
      if (!AuthGuard.isAdminAuthenticated()) {
        AuthGuard.logoutAdmin();
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
    if (!AuthGuard.isAdminAuthenticated()) {
      AuthGuard.logoutAdmin();
    }
  }, []);

  // State for sections navigation
  const [activeSection, setActiveSection] = useState('Profile');
  
  // State to track if admin data has been loaded
  const [adminLoaded, setAdminLoaded] = useState(!!admin && Object.keys(admin).length > 0);
  
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
    username: adminName,
    email: adminEmail
  });
  
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Theme state — persisted in localStorage, synced with data-theme attribute
  const [theme, setTheme] = useState(
    () => localStorage.getItem('ibh-theme') || 'dark'
  );
  
  // Branch creation states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    country: adminCountry,
    city: '',
    bankName: adminBankName,
    branch: '',
    code: ''
  });
  const [isBranchLoading, setIsBranchLoading] = useState(false);
  const [branchMessage, setBranchMessage] = useState('');

  const extractAdminId = (adminObj) => {
    if (!adminObj || typeof adminObj !== 'object') return null;
    const possibleIdFields = ['adminId', 'id', 'ID', '_id', 'admin_id'];
    for (const field of possibleIdFields) {
      if (adminObj[field] !== undefined && adminObj[field] !== null && adminObj[field] !== '') {
        return adminObj[field];
      }
    }
    return null;
  };

  // Load admin data from AuthGuard if not already set
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const savedAdmin = AuthGuard.getAdminData();
        if (savedAdmin && typeof savedAdmin === 'object' && Object.keys(savedAdmin).length > 0) {
          setAdmin(savedAdmin);
          setAdminLoaded(true);
        } else {
          // If no admin data in AuthGuard, redirect to signin
          console.warn('No admin data found, redirecting to signin');
          AuthGuard.logoutAdmin();
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
        AuthGuard.logoutAdmin();
      }
    };
    
    if (!admin || Object.keys(admin).length === 0) {
      loadAdminData();
    } else {
      setAdminLoaded(true);
    }
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ibh-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const fetchData = async () => {
      if (!adminBankName) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const fetchedAccounts = await fetchAllAccounts(adminBankName);
        setAccounts(fetchedAccounts);
      } catch (err) {
        setAccounts([]); // Set accounts to an empty array instead of showing an error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adminBankName]);

  // Hydrate complete admin profile once when dashboard starts with partial login payload
  useEffect(() => {
    const hydrateAdminProfile = async () => {
      const adminId = extractAdminId(admin);
      if (!adminId) return;

      const hasCompleteProfile = !!(adminName && adminEmail && adminBankName);
      if (hasCompleteProfile) return;

      try {
        const fullAdmin = await getAdminById(adminId);
        if (fullAdmin && typeof fullAdmin === 'object' && Object.keys(fullAdmin).length > 0) {
          const mergedAdmin = { ...admin, ...fullAdmin };
          setAdmin(mergedAdmin);
          AuthGuard.setAdminData(mergedAdmin);
        }
      } catch (error) {
        console.warn('Failed to hydrate admin profile details:', error);
      }
    };

    if (adminLoaded) {
      hydrateAdminProfile();
    }
  }, [adminLoaded]);

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

  // Prompt before manual URL/page leave and clear session when user confirms leaving.
  useEffect(() => {
    const cleanup = AuthGuard.registerLeavePromptAndAutoLogout({ isAdmin: true });
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

  const handleUpdateAdmin = async () => {
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

  const closeEditModal = () => {
    setShowEditModal(false);
    setMessage('');
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setMessage('');
  };

  const handleLogout = () => {
    AuthGuard.logout();
  };

  const openEditModal = () => {
    setEditFormData({
      username: adminName,
      email: adminEmail
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
    console.log('Creating branch with data:', branchFormData);

    try {
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
        country: admin.country || '',
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
    console.log('Opening branch modal with initial data:')
    setBranchFormData({
      country: adminCountry || '',
      city: '',
      bankName: adminBankName || '',
      branch: '',
      code: ''
    });
    setBranchMessage('');
    setShowBranchModal(true);
  };

  // Sidebar navigation items aligned with UserPage naming style
  const sidebarItems = [
    { id: 'Profile', label: 'My Profile', icon: <FaUserShield /> },
    { id: 'Dashboard', label: 'Dashboard', icon: <FaChartBar /> },
    { id: 'Applications', label: 'Applications', icon: <FaUsers /> },
    { id: 'AddBranch', label: 'New Branch', icon: <FaBuilding /> }
  ];

  // Content rendering functions
  const renderDashboardContent = () => (
    <div className="content-section">
      <h2 className="section-title">Dashboard <em>Overview</em></h2>
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon pending">📋</div>
            <div className="stat-info">
              <h3>{accounts.filter(acc => acc.status?.toLowerCase() === 'pending').length}</h3>
              <p>Pending Applications</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-info">
              <h3>{accounts.filter(acc => acc.status?.toLowerCase() === 'approved').length}</h3>
              <p>Approved Accounts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">❌</div>
            <div className="stat-info">
              <h3>{accounts.filter(acc => acc.status?.toLowerCase() === 'rejected').length}</h3>
              <p>Rejected Applications</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total">📊</div>
            <div className="stat-info">
              <h3>{accounts.length}</h3>
              <p>Total Applications</p>
            </div>
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="action-btn primary" onClick={() => setActiveSection('Applications')}>
            <FaUsers /> View Applications
          </button>
          <button className="action-btn secondary" onClick={() => setActiveSection('AddBranch')}>
            <FaBuilding /> Add New Branch
          </button>
        </div>
      </div>
    </div>
  );

  const renderApplicationsContent = () => (
    <div className="content-section">
      <h2 className="section-title">Bank <em>Applications</em></h2>
      <div className="applications-controls">
        <div className="filter-container">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select 
            id="statusFilter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="All">All Applications</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : (() => {
        const filteredAccounts = accounts.filter(acc =>
          statusFilter === 'All'
            ? true
            : (acc.status || '').toLowerCase() === statusFilter.toLowerCase()
        );
        
        return filteredAccounts.length === 0 ? (
          <div className="no-applications">
            <div className="no-applications-icon">🏦</div>
            <h3>No {statusFilter} Applications</h3>
            <p>There are currently no {statusFilter.toLowerCase()} applications to review.</p>
          </div>
        ) : (
          <div className="applications-grid">
            {filteredAccounts.map(app => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <h4>👤 {app.applicant || app.fullName}</h4>
                  <span className={`status-badge ${app.status?.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>
                <div className="application-details">
                  <p><strong>📧 Email:</strong> {app.email}</p>
                  <p><strong>🌍 Country:</strong> {app.country || app.location || '-'}</p>
                  <p><strong>🏦 Bank:</strong> {app.bank || app.bankName || adminBankName}</p>
                </div>
                <div className="application-actions">
                  {app.status?.toLowerCase() === 'pending' && (
                    <div className="approval-buttons">
                      <button
                        className="approve-btn"
                        disabled={!!processingId}
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to approve this account?')) {
                            setProcessingId(app.id);
                            try {
                              await approveAccount(app.id);
                              updateAccountStatus(app.id, 'Approved');
                              setSuccessMsg('Account approved successfully!');
                              setTimeout(() => setSuccessMsg(''), 3000);
                            } catch (err) {
                              alert('Failed to approve account');
                            } finally {
                              setProcessingId(null);
                            }
                          }
                        }}
                      >
                        {processingId === app.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="reject-btn"
                        disabled={!!processingId}
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to reject this account?')) {
                            setProcessingId(app.id);
                            try {
                              await rejectAccount(app.id);
                              updateAccountStatus(app.id, 'Rejected');
                              setSuccessMsg('Account rejected successfully!');
                              setTimeout(() => setSuccessMsg(''), 3000);
                            } catch (err) {
                              alert('Failed to reject account');
                            } finally {
                              setProcessingId(null);
                            }
                          }
                        }}
                      >
                        {processingId === app.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}
                  <button className="view-details-btn" onClick={() => setSelectedAccount(app)}>
                    <FaEye /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
      
      {successMsg && (
        <div className="success-message">
          {successMsg}
        </div>
      )}
    </div>
  );

  const renderProfileContent = () => (
    <div className="content-section profile-section">
      <h2 className="section-title">My <em>Profile</em></h2>
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <FaUserShield size={40} />
          </div>
          <div className="profile-info">
            <h3>{adminName ? adminName.charAt(0).toUpperCase() + adminName.slice(1) : 'Admin'}</h3>
            <p className="user-subtitle">Bank Administrator</p>
            <div className="user-status">
              <span className="status-indicator active"></span>
              <span className="status-text">Active Session</span>
            </div>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-icon">🏦</div>
                <span className="detail-label">Bank Name</span>
              </div>
              <span className="detail-value">{adminBankName || 'Not Available'}</span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-icon">📧</div>
                <span className="detail-label">Email Address</span>
              </div>
              <span className="detail-value">{adminEmail ? adminEmail.charAt(0).toUpperCase() + adminEmail.slice(1) : 'Not Available'}</span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-icon">👤</div>
                <span className="detail-label">Username</span>
              </div>
              <span className="detail-value">{adminName || 'Not Available'}</span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-icon">🔑</div>
                <span className="detail-label">Admin Role</span>
              </div>
              <span className="detail-value status-active">Bank Administrator</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button className="action-btn primary" onClick={() => setShowEditModal(true)}>
            <FaEdit /> Edit Details
          </button>
          <button className="action-btn secondary" onClick={() => setShowPasswordModal(true)}>
            <FaKey /> Change Password
          </button>
          <button className="action-btn logout" onClick={handleLogout}>
            <FaSignOutAlt /> Secure Logout
          </button>
        </div>
      </div>
    </div>
  );

  const renderAddBranchContent = () => (
    <div className="content-section">
      <h2 className="section-title">New <em>Branch</em></h2>
      <div className="add-branch-content">
        <div className="add-branch-header">
          <h3>Create a New Bank Branch</h3>
          <p>Expand your banking network by adding a new branch location.</p>
        </div>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-label">Branch Management</span>
            <span className="feature-description">Manage multiple locations</span>
          </div>
          <div className="feature-item">
            <span className="feature-label">Location Tracking</span>
            <span className="feature-description">Organize by city and country</span>
          </div>
          <div className="feature-item">
            <span className="feature-label">Unique Codes</span>
            <span className="feature-description">Generate branch identifiers</span>
          </div>
        </div>
        
        <div className="add-branch-action">
          <button className="create-branch-btn" onClick={() => setShowBranchModal(true)}>
            <FaPlus /> Add New Branch
          </button>
        </div>
      </div>
    </div>
  );

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard':
        return renderDashboardContent();
      case 'Applications':
        return renderApplicationsContent();
      case 'Profile':
        return renderProfileContent();
      case 'AddBranch':
        return renderAddBranchContent();
      default:
        return renderDashboardContent();
    }
  };

  // Loading state while admin data is being fetched
  if (!adminLoaded) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard-container">
        {/* Enhanced Professional Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="admin-avatar-sidebar">
              <FaUserShield size={24} />
            </div>
            <div className="admin-info-sidebar">
              <h3>{adminName ? adminName.charAt(0).toUpperCase() + adminName.slice(1) : 'Admin'}</h3>
              <p>Bank Administrator</p>
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

          {/* Theme Toggle */}
          <div className="sidebar-theme-toggle">
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <HiSun size={18} /> : <HiMoon size={18} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Professional Main Content Area */}
        <div className="main-content">
          {renderContent()}
        </div>
      </div>

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="modal-overlay" onClick={() => setSelectedAccount(null)}>
          <div className="modal-container large-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedAccount(null)} className="modal-close-btn">
              <FaTimes />
            </button>
            <h2 className="modal-title">Application Details</h2>
            <div className="account-details-content">
              <h3>{selectedAccount.applicant || selectedAccount.fullName}</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Email:</strong> {selectedAccount.email}
                </div>
                <div className="detail-item">
                  <strong>Country:</strong> {selectedAccount.country || selectedAccount.location || '-'}
                </div>
                <div className="detail-item">
                  <strong>Bank:</strong> {selectedAccount.bank || selectedAccount.bankName || adminBankName}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${selectedAccount.status?.toLowerCase()}`}>
                    {selectedAccount.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Details Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={closeEditModal} className="modal-close-btn">✕</button>
              <h2 className="modal-title">Edit Admin Details</h2>
              {message && (
                <div className={`success-message ${message.includes('Error') ? 'error' : ''}`}>
                  {message}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAdmin(); }} className="modal-form">
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
                    value={adminBankName || ''}
                    disabled
                    className="form-input readonly"
                  />
                  <small className="disabled-note">Bank name cannot be changed</small>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={closeEditModal} className="form-btn cancel">Cancel</button>
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
              <button onClick={closePasswordModal} className="modal-close-btn">✕</button>
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
                  <button type="button" onClick={closePasswordModal} className="form-btn cancel">Cancel</button>
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
                    value={branchFormData.country}
                    className="form-input readonly"
                    placeholder="Country"
                    readOnly
                    style={{ pointerEvents: 'none' }}
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
                    value={branchFormData.bankName}
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

      <Footer />
    </>
  );
};

export default AdminPage;