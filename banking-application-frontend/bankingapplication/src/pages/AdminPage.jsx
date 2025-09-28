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

  // State for all applications
  const [accounts, setAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="adminpage-container" style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '32px', maxWidth: 1100, margin: '40px auto 40px 40px', justifyContent: 'flex-start' }}>
          {/* Left: Admin Info */}
          <div className="adminpage-left" style={{ flex: '0 0 990px', margin: '0 0 32px 48px', background: '#f7f7fa', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #eee', textAlign: 'left' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{admin.icon || '👨‍💼'}</div>
            <h2 style={{ marginBottom: 8 }}>
              {admin.username ? admin.username.charAt(0).toUpperCase() + admin.username.slice(1) : 'Admin'}
            </h2>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Bank: {admin.bankname || 'N/A'}</div>
            <div style={{ fontWeight: 500, color: '#222' }}>Email: {admin.email ? admin.email.charAt(0).toUpperCase() + admin.email.slice(1) : 'N/A'}</div>
          </div>
          {/* Right: Pending Applications */}
          <div className="adminpage-right" style={{ flex: 2, minWidth: 900, marginLeft: '48px', width: '1600px', maxWidth: '100vw', overflowX: 'auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #eee' }}>
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
              const filteredAccounts = accounts.filter(acc =>
                statusFilter === 'All' ? true : acc.status?.toLowerCase() === statusFilter.toLowerCase()
              );
              return filteredAccounts.length === 0 ? (
                <div>No {statusFilter.toLowerCase()} applications.</div>
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
                        }}>{app.status}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {app.status?.toLowerCase() === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>Approve</button>
                              <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>Reject</button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default AdminPage;
