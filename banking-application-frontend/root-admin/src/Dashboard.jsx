import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardAPI from './services/adminDashboardAPI';
import './Dashboard.css';
import { getInitialRootAdminTheme, setRootAdminTheme } from './rootAdminTheme';

const ACTION_HISTORY_KEY = 'rootAdminDecisionHistory';
const MAX_HISTORY_ITEMS = 300;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeSection, setActiveSection] = useState('queue');
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage with proper error handling
    try {
      const userData = localStorage.getItem('adminUser');
      if (userData && userData !== 'undefined' && userData !== 'null') {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clear corrupted data
      localStorage.removeItem('adminUser');
    }

    // Fetch pending applications
    fetchPendingApplications();

    setTheme(getInitialRootAdminTheme());

    const rawHistory = localStorage.getItem(ACTION_HISTORY_KEY);
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          setDecisionHistory(parsed);
        }
      } catch (error) {
        console.error('Unable to parse decision history:', error);
        localStorage.removeItem(ACTION_HISTORY_KEY);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setRootAdminTheme(nextTheme);
  };

  const persistHistory = (items) => {
    localStorage.setItem(ACTION_HISTORY_KEY, JSON.stringify(items));
  };

  const addHistoryRecord = (actionType, application, message = '') => {
    const historyItem = {
      id: `${actionType}-${application?.id || 'na'}-${Date.now()}`,
      action: actionType,
      applicationId: application?.id || null,
      username: application?.username || 'Unknown',
      email: application?.email || 'Unknown',
      bankname: application?.bankname || 'Unknown',
      country: application?.country || 'Unknown',
      actor: user?.username || 'Root Admin',
      note: message,
      timestamp: new Date().toISOString(),
    };

    setDecisionHistory((prev) => {
      const next = [historyItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      persistHistory(next);
      return next;
    });
  };

  const fetchPendingApplications = async () => {
    try {
      setLoading(true);
      const result = await AdminDashboardAPI.getPendingApplications();
      
      if (result.success) {
        setApplications(result.data);
      } else {
        console.error('Failed to fetch applications:', result.error);
        // Handle authentication errors
        if (result.status === 401) {
          handleSignOut();
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
  };

  const handleApproveApplication = async (applicationId) => {
    if (!confirm('Are you sure you want to approve this application?')) {
      return;
    }

    try {
      setProcessingId(applicationId);
      const result = await AdminDashboardAPI.approveApplication(applicationId);
      const application = applications.find((app) => app.id === applicationId);
      
      if (result.success) {
        // Remove approved application from list
        setApplications((prev) => prev.filter((app) => app.id !== applicationId));
        addHistoryRecord('APPROVED', application, result.message || 'Application approved successfully.');
        alert(result.message || 'Application approved successfully!');
      } else {
        alert(result.error || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error approving application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    try {
      setProcessingId(applicationId);
      const result = await AdminDashboardAPI.rejectApplication(applicationId);
      const application = applications.find((app) => app.id === applicationId);
      
      if (result.success) {
        // Remove rejected application from list
        setApplications((prev) => prev.filter((app) => app.id !== applicationId));
        addHistoryRecord('REJECTED', application, result.message || 'Application rejected successfully.');
        alert(result.message || 'Application rejected successfully!');
      } else {
        alert(result.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSignOut = () => {
    // Clear stored data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Navigate to signin page using React Router
    navigate('/');
  };

  const approvedAdmins = useMemo(() => {
    const latestPerEmail = new Map();

    decisionHistory
      .filter((entry) => entry.action === 'APPROVED')
      .forEach((entry) => {
        const key = entry.email || entry.username;
        const existing = latestPerEmail.get(key);
        if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
          latestPerEmail.set(key, entry);
        }
      });

    return Array.from(latestPerEmail.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [decisionHistory]);

  const approvalCount = decisionHistory.filter((entry) => entry.action === 'APPROVED').length;
  const rejectionCount = decisionHistory.filter((entry) => entry.action === 'REJECTED').length;

  const navItems = [
    { id: 'queue', label: 'Review Queue' },
    { id: 'history', label: 'Decision History' },
    { id: 'admins', label: 'Current Admins' },
    { id: 'insights', label: 'Insights' },
  ];

  return (
    <div className="dashboard-container" data-theme={theme}>
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.username || 'Admin'}</span>
            <button onClick={toggleTheme} className="theme-toggle-btn" type="button">
              {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </button>
            <button onClick={handleSignOut} className="signout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <h3>Operations</h3>
            <div className="sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-btn ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="sidebar-card">
              <h4>Quick Summary</h4>
              <p>Pending Reviews: <strong>{applications.length}</strong></p>
              <p>Total Approvals: <strong>{approvalCount}</strong></p>
              <p>Total Rejections: <strong>{rejectionCount}</strong></p>
              <p>Known Active Admins: <strong>{approvedAdmins.length}</strong></p>
            </div>

            <div className="sidebar-card">
              <h4>Actions</h4>
              <button type="button" className="sidebar-action-btn" onClick={fetchPendingApplications}>
                Refresh Queue
              </button>
              <button
                type="button"
                className="sidebar-action-btn"
                onClick={() => {
                  localStorage.removeItem(ACTION_HISTORY_KEY);
                  setDecisionHistory([]);
                }}
              >
                Clear Local History
              </button>
            </div>
          </aside>

          <main className="dashboard-main-panel">
            {activeSection === 'queue' && (
              <div className="applications-section">
                <div className="section-header">
                  <h2>Applications Pending Approval</h2>
                  <div className="stats">
                    <span className="pending-count">{applications.length} Pending</span>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Applications Pending</h3>
                    <p>All applications have been processed</p>
                  </div>
                ) : (
                  <div className="applications-grid">
                    {applications.map((application) => (
                      <div key={application.id} className="application-card">
                        <div className="application-header">
                          <div className="application-info">
                            <h3>{application.username}</h3>
                            <span className="application-type">Admin Application</span>
                          </div>
                          <div className="application-status">
                            <span className="status-badge pending">{application.applicationStatus}</span>
                          </div>
                        </div>

                        <div className="application-details">
                          <div className="detail-item">
                            <span className="label">Application ID:</span>
                            <span className="value">{application.id}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Submitted:</span>
                            <span className="value">{new Date(application.createdDate).toLocaleDateString()}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Email:</span>
                            <span className="value">{application.email}</span>
                          </div>
                        </div>

                        <div className="application-actions">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleViewApplication(application)}
                          >
                            View Details
                          </button>
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleApproveApplication(application.id)}
                            disabled={processingId === application.id}
                          >
                            {processingId === application.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleRejectApplication(application.id)}
                            disabled={processingId === application.id}
                          >
                            {processingId === application.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'history' && (
              <div className="applications-section">
                <div className="section-header">
                  <h2>Approval/Rejection History</h2>
                  <div className="stats">
                    <span className="pending-count">{decisionHistory.length} Records</span>
                  </div>
                </div>
                {decisionHistory.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🗂️</div>
                    <h3>No Local History Yet</h3>
                    <p>Decisions taken from this dashboard will appear here.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {decisionHistory.map((entry) => (
                      <article key={entry.id} className="history-item">
                        <div className="history-title-row">
                          <h4>{entry.username}</h4>
                          <span className={`status-badge ${entry.action === 'APPROVED' ? 'approved' : 'rejected'}`}>
                            {entry.action}
                          </span>
                        </div>
                        <p><strong>Email:</strong> {entry.email}</p>
                        <p><strong>Bank:</strong> {entry.bankname}</p>
                        <p><strong>Actor:</strong> {entry.actor}</p>
                        <p><strong>At:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
                        <p><strong>Note:</strong> {entry.note || 'No additional notes'}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'admins' && (
              <div className="applications-section">
                <div className="section-header">
                  <h2>Current Admins</h2>
                  <div className="stats">
                    <span className="pending-count">{approvedAdmins.length} Identified</span>
                  </div>
                </div>
                {approvedAdmins.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No Approved Admin Records</h3>
                    <p>Approve applications to build the active admin list.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {approvedAdmins.map((entry) => (
                      <article key={entry.id} className="history-item">
                        <div className="history-title-row">
                          <h4>{entry.username}</h4>
                          <span className="status-badge approved">Active</span>
                        </div>
                        <p><strong>Email:</strong> {entry.email}</p>
                        <p><strong>Bank:</strong> {entry.bankname}</p>
                        <p><strong>Country:</strong> {entry.country}</p>
                        <p><strong>Approved:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'insights' && (
              <div className="applications-section">
                <div className="section-header">
                  <h2>Useful Insights</h2>
                </div>
                <div className="insights-grid">
                  <div className="insight-card">
                    <h4>Decision Velocity</h4>
                    <p>{decisionHistory.length} decisions recorded in this browser.</p>
                  </div>
                  <div className="insight-card">
                    <h4>Approval Ratio</h4>
                    <p>
                      {decisionHistory.length === 0
                        ? 'No decisions yet.'
                        : `${Math.round((approvalCount / decisionHistory.length) * 100)}% approvals`}
                    </p>
                  </div>
                  <div className="insight-card">
                    <h4>Queue Health</h4>
                    <p>{applications.length === 0 ? 'No pending applications.' : `${applications.length} pending applications need review.`}</p>
                  </div>
                  <div className="insight-card">
                    <h4>Audit Tip</h4>
                    <p>Use the history section before sign-out to verify each decision trace.</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Application Details</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedApplication(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Username:</span>
                      <span className="value">{selectedApplication.username}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{selectedApplication.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Bank Name:</span>
                      <span className="value">{selectedApplication.bankname || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Country:</span>
                      <span className="value">{selectedApplication.country || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="detail-section">
                  <h4>Application Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Application ID:</span>
                      <span className="value">{selectedApplication.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Application Status:</span>
                      <span className="value">{selectedApplication.applicationStatus}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Created Date:</span>
                      <span className="value">{new Date(selectedApplication.createdDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Rejection Reason:</span>
                      <span className="value">{selectedApplication.rejectionReason || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="action-btn approve-btn"
                  onClick={() => {
                    handleApproveApplication(selectedApplication.id);
                    setSelectedApplication(null);
                  }}
                >
                  Approve Application
                </button>
                <button 
                  className="action-btn reject-btn"
                  onClick={() => {
                    handleRejectApplication(selectedApplication.id);
                    setSelectedApplication(null);
                  }}
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;