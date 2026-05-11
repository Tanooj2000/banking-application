import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthGuard } from './authGuard';

const ProtectedRoute = ({ children, requireAuth = true, adminOnly = false, userOnly = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (adminOnly) {
          // Check admin authentication (legacy session-based)
          const isAdminAuth = AuthGuard.isAdminAuthenticated();
          const adminUserType = localStorage.getItem('userType');
          setIsAuthenticated(isAdminAuth && adminUserType === 'admin');
          setUserType(adminUserType);
        } else {
          // Check JWT-based authentication for users
          const isAuth = AuthGuard.isAuthenticated();
          const currentUserType = AuthGuard.getUserType();
          setIsAuthenticated(isAuth);
          setUserType(currentUserType);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserType(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [adminOnly]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    // Store the intended destination for post-login redirect
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/signin" replace />;
  }

  if (adminOnly && (!isAuthenticated || userType !== 'admin')) {
    return <Navigate to="/signin" replace />;
  }

  if (userOnly && (!isAuthenticated || userType === 'admin')) {
    if (userType === 'admin') {
      return <Navigate to="/adminpage" replace />;
    }
    return <Navigate to="/signin" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from login/register pages
    if (userType === 'admin') {
      return <Navigate to="/adminpage" replace />;
    } else {
      return <Navigate to="/userpage" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;