import React, { useEffect } from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { checkAuthOnPageLoad, AuthGuard } from './utils/authGuard'
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const Root = () => {
  useEffect(() => {
    checkAuthOnPageLoad();

    const handlePageShow = (e) => {
      if (e.persisted) {
        // If page is restored from bfcache after logout, enforce redirect
        if (sessionStorage.getItem('loggedOut') === 'true') {
          AuthGuard.logout();
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </AuthProvider>
    </ErrorBoundary>
  );
};

createRoot(document.getElementById('root')).render(<Root />)
