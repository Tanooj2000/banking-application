import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { FaUniversity } from 'react-icons/fa';
import { AuthGuard } from '../utils/authGuard';


const Header = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userType, setUserType] = useState(null); // Track user type
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll detection for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check on mount and on route change
    const token = localStorage.getItem('authToken');
    const storedUserType = localStorage.getItem('userType');
    const currentUser = localStorage.getItem('currentUser');
    const adminData = sessionStorage.getItem('adminData');
    const loggedOut = sessionStorage.getItem('loggedOut');
    
    // Check if admin is authenticated using legacy admin auth
    const isAdminAuth = storedUserType === 'admin' && adminData && loggedOut !== 'true' && AuthGuard.isAdminAuthenticated();
    // Check if user is authenticated using JWT token
    const isUserAuth = storedUserType === 'user' && token && currentUser && AuthGuard.isAuthenticated();
    
    setIsSignedIn(isAdminAuth || isUserAuth);
    setUserType(isAdminAuth ? 'admin' : isUserAuth ? 'user' : null);
    
    // Listen for changes in localStorage and sessionStorage
    const handleStorage = () => {
      const currentToken = localStorage.getItem('authToken');
      const currentUserType = localStorage.getItem('userType');
      const currentUserData = localStorage.getItem('currentUser');
      const currentAdminData = sessionStorage.getItem('adminData');
      const currentLoggedOut = sessionStorage.getItem('loggedOut');
      
      const currentIsAdminAuth = currentUserType === 'admin' && currentAdminData && currentLoggedOut !== 'true' && AuthGuard.isAdminAuthenticated();
      const currentIsUserAuth = currentUserType === 'user' && currentToken && currentUserData && AuthGuard.isAuthenticated();
      
      setIsSignedIn(currentIsAdminAuth || currentIsUserAuth);
      setUserType(currentIsAdminAuth ? 'admin' : currentIsUserAuth ? 'user' : null);
    };
    
    // Check auth status periodically for admin users
    const checkAuth = () => {
      if (userType === 'admin') {
        handleStorage();
      } else if (userType === 'user') {
        // For JWT users, we rely on 401/403 error handling in API calls
        // But still check if token exists
        if (!localStorage.getItem('authToken')) {
          handleStorage();
        }
      }
    };
    
    const interval = setInterval(checkAuth, 5000); // Check every 5 seconds
    
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [location]);

  const handleLogout = async () => {
    try {
      if (userType === 'admin' || sessionStorage.getItem('adminData')) {
        AuthGuard.logoutAdmin();
      } else {
        // Use the new JWT-based logout
        await AuthGuard.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      window.location.href = '/';
    }
    
    setIsSignedIn(false);
    setUserType(null);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <nav className={`apple-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-wrapper">
            <FaUniversity className="logo-icon" />
            <span className="logo-text">InterBankHub</span>
          </div>
        </Link>
        
        <ul className="nav-links">
          {!isSignedIn ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/about">About</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/signin">Sign In</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link nav-link-primary" to="/signup">Sign Up</Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              {userType === 'admin' ? (
                <li className="nav-item">
                  <Link className="nav-link" to="/adminpage">Dashboard</Link>
                </li>
              ) : (
                <li className="nav-item">
                  <Link className="nav-link" to="/userpage">Dashboard</Link>
                </li>
              )}
              <li className="nav-item">
                <Link className="nav-link" to="/about">About</Link>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link nav-logout-btn">
                  Sign Out
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Header;
