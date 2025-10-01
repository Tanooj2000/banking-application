import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
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
  }, []);

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
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>User Management</h3>
            <p>Manage system users and permissions</p>
            <button className="card-btn">Manage Users</button>
          </div>

          <div className="dashboard-card">
            <h3>System Settings</h3>
            <p>Configure system parameters</p>
            <button className="card-btn">Settings</button>
          </div>

          <div className="dashboard-card">
            <h3>Reports</h3>
            <p>View system reports and analytics</p>
            <button className="card-btn">View Reports</button>
          </div>

          <div className="dashboard-card">
            <h3>Security</h3>
            <p>Security settings and audit logs</p>
            <button className="card-btn">Security</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;