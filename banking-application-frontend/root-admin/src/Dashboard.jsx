import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardAPI from './services/adminDashboardAPI';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
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
  }, []);

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
      
      if (result.success) {
        // Remove approved application from list
        setApplications(prev => prev.filter(app => app.id !== applicationId));
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
      
      if (result.success) {
        // Remove rejected application from list
        setApplications(prev => prev.filter(app => app.id !== applicationId));
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.username || 'Admin'}</span>
            <button onClick={handleSignOut} className="signout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
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
                      👁️ View Details
                    </button>
                    <button 
                      className="action-btn approve-btn"
                      onClick={() => handleApproveApplication(application.id)}
                      disabled={processingId === application.id}
                    >
                      {processingId === application.id ? '⏳' : '✅'} Approve
                    </button>
                    <button 
                      className="action-btn reject-btn"
                      onClick={() => handleRejectApplication(application.id)}
                      disabled={processingId === application.id}
                    >
                      {processingId === application.id ? '⏳' : '❌'} Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  ✅ Approve Application
                </button>
                <button 
                  className="action-btn reject-btn"
                  onClick={() => {
                    handleRejectApplication(selectedApplication.id);
                    setSelectedApplication(null);
                  }}
                >
                  ❌ Reject Application
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