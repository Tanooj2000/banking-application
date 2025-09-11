import React from 'react';
import Header from '../components/Header';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const CreateAccount = () => {
  const query = useQuery();
  const bankName = query.get('bank');

  return (
    <>
      <Header />
      <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', color: '#1976d2' }}>Create Account</h2>
        <p style={{ textAlign: 'center', fontSize: '1.2rem', margin: '24px 0' }}>
          Selected Bank: <strong>{bankName || 'N/A'}</strong>
        </p>
        {/* Add your account creation form here */}
      </div>
    </>
  );
};

export default CreateAccount;
