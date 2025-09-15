import React from 'react';
import Footer from '../components/Footer';

const AdminPage = () => {
  return (
    <>
      <div className="adminpage-container">
        <h2>Welcome to the Admin Page!</h2>
        <p>You have successfully signed in as an admin.</p>
      </div>
      <Footer />
    </>
  );
};

export default AdminPage;
