import React from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';


const AdminPage = () => {
  // Placeholder admin info
  const adminInfo = {
    name: 'John Admin',
    bank: 'Axis Bank',
    email: 'admin@axisbank.com',
    icon: '👨‍💼',
  };

  // Placeholder pending applications
  const pendingApplications = [
    { id: 1, applicant: 'Amit Kumar', country: 'India', email: 'amit@example.com', status: 'pending' },
    { id: 2, applicant: 'Sarah Lee', country: 'USA', email: 'sarah@example.com', status: 'pending' },
  ];

  return (
    <>
      <Header />
      <div className="adminpage-container" style={{ display: 'flex', gap: '32px', maxWidth: 1100, margin: '40px auto' }}>
        {/* Left: Admin Info */}
        <div className="adminpage-left" style={{ flex: 1, background: '#f7f7fa', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #eee' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{adminInfo.icon}</div>
          <h2 style={{ marginBottom: 8 }}>{adminInfo.name}</h2>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Bank: {adminInfo.bank}</div>
          <div style={{ color: '#555' }}>Email: {adminInfo.email}</div>
        </div>
        {/* Right: Pending Applications */}
        <div className="adminpage-right" style={{ flex: 2, background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #eee' }}>
          <h2 style={{ marginBottom: 16 }}>Pending Applications</h2>
          {pendingApplications.length === 0 ? (
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
                    <td style={{ padding: '8px 12px' }}>{app.applicant}</td>
                    <td style={{ padding: '8px 12px' }}>{app.country}</td>
                    <td style={{ padding: '8px 12px' }}>{app.email}</td>
                    <td style={{ padding: '8px 12px', color: '#d99a00' }}>{app.status}</td>
                    <td style={{ padding: '8px 12px' }}>
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
    </>
  );
};

export default AdminPage;
