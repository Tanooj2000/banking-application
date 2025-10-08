import React from 'react';

// Simple neutral overlay to avoid white flash if a protected page is briefly mounted
export const BlockedOverlay = () => (
  <div style={{
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '1rem'
  }}>
    Securing session...
  </div>
);

export default BlockedOverlay;