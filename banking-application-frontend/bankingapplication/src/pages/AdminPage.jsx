import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { fetchAllAccounts, approveAccount, rejectAccount } from '../api/accountApi';


const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Access admin object passed from SignIn page
  const admin = location.state?.admin || {};

  // State for pending applications
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const accounts = await fetchAllAccounts(admin.bankname);
        // Filter only pending applications if needed
        const pending = accounts.filter(acc => acc.status === 'pending');
        setPendingApplications(pending);
      } catch (err) {
        setError(err.message || 'Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="adminpage-container" style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '32px', maxWidth: 1100, margin: '40px auto 40px 40px', justifyContent: 'flex-start' }}>
          {/* Left: Admin Info */}
          <div className="adminpage-left" style={{ flex: '0 0 260px', marginLeft: '24px', marginRight: '32px', background: '#f7f7fa', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #eee' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{admin.icon || '👨‍💼'}</div>
            <h2 style={{ marginBottom: 8 }}>
              {admin.username ? admin.username.charAt(0).toUpperCase() + admin.username.slice(1) : 'Admin'}
            </h2>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Bank: {admin.bankname || 'N/A'}</div>
            <div style={{ fontWeight: 500, color: '#222' }}>Email: {admin.email ? admin.email.charAt(0).toUpperCase() + admin.email.slice(1) : 'N/A'}</div>
          </div>
          {/* Right: Pending Applications */}
          <div className="adminpage-right" style={{ flex: 2, minWidth: 400, marginLeft: '16px', width: '900px', maxWidth: '100vw', overflowX: 'auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #eee' }}>
            <h2 style={{ marginBottom: 16 }}>Pending Applications</h2>
            {loading ? (
              <div>Loading pending applications...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : pendingApplications.length === 0 ? (
              <div>No pending applications.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Applicant</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Country</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>{app.applicant || app.name}</td>
                      <td style={{ padding: '8px 12px' }}>{app.country || app.location || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>{app.email}</td>
                      <td style={{ padding: '8px 12px', color: '#d99a00' }}>{app.status}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {/* Approve/Reject buttons can be added here */}
                        <button style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default AdminPage;
