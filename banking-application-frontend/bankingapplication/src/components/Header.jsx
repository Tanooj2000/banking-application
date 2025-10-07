import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { FaUniversity } from 'react-icons/fa';
import { AuthGuard } from '../utils/authGuard';


const Header = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userType, setUserType] = useState(null); // Track user type
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check on mount and on route change
    const token = sessionStorage.getItem('userToken');
    const type = sessionStorage.getItem('userType');
    const adminData = sessionStorage.getItem('adminData');
    const loggedOut = sessionStorage.getItem('loggedOut');
    
    // Check if admin is authenticated using AuthGuard
    const isAdminAuth = type === 'admin' && adminData && loggedOut !== 'true' && AuthGuard.isAuthenticated();
    const isUserAuth = type === 'user' && token;
    
    setIsSignedIn(isAdminAuth || isUserAuth);
    setUserType(isAdminAuth ? 'admin' : isUserAuth ? 'user' : null);
    
    // Listen for changes in sessionStorage (e.g., from other tabs or after login)
    const handleStorage = () => {
      const currentToken = sessionStorage.getItem('userToken');
      const currentType = sessionStorage.getItem('userType');
      const currentAdminData = sessionStorage.getItem('adminData');
      const currentLoggedOut = sessionStorage.getItem('loggedOut');
      
      const currentIsAdminAuth = currentType === 'admin' && currentAdminData && currentLoggedOut !== 'true' && AuthGuard.isAuthenticated();
      const currentIsUserAuth = currentType === 'user' && currentToken;
      
      setIsSignedIn(currentIsAdminAuth || currentIsUserAuth);
      setUserType(currentIsAdminAuth ? 'admin' : currentIsUserAuth ? 'user' : null);
    };
    
    // Check auth status periodically for admin users
    const checkAuth = () => {
      if (type === 'admin') {
        handleStorage();
      }
    };
    
    const interval = setInterval(checkAuth, 1000); // Check every second for admin
    
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [location]);

  const logToLocalStorage = (message, data) => {
    const logs = JSON.parse(localStorage.getItem('debugLogs')) || [];
    logs.push({ message, data, timestamp: new Date().toISOString() });
    localStorage.setItem('debugLogs', JSON.stringify(logs));
  };

  const handleLogout = () => {

    if (userType === 'admin' || sessionStorage.getItem('adminData')) {
      AuthGuard.logout();
    } else {
      AuthGuard.logoutUser();
    }

    // Ensure state is reset properly
    setIsSignedIn(false);
    setUserType(null);

    // Dispatch storage event
    window.dispatchEvent(new Event('storage'));
   
  };

  return (
    <nav className="nav">
      <Link to="/" className="nav__logo">
        <div className="logo-wrapper">
          <FaUniversity className="logo-icon" />
          <span className="logo-text">InterBankHub</span>
        </div>
      </Link>
      
      <ul className="nav__links">
        {!isSignedIn ? (
          <>
            <li className="nav__item"><Link className="nav__link" to="/">Home</Link></li>
            <li className="nav__item"><Link className="nav__link" to="/about">About</Link></li>
            <li className="nav__item"><Link className="nav__link" to="/signin">Sign In</Link></li>
            <li className="nav__item"><Link className="nav__link " to="/signup">Sign Up</Link></li>
          </>
        ) : (
          <>
            <li className="nav__item"><Link className="nav__link" to="/">Home</Link></li>
            {userType === 'admin' ? (
              <li className="nav__item"><Link className="nav__link" to="/adminpage">My Dashboard</Link></li>
            ) : (
              <li className="nav__item"><Link className="nav__link" to="/userpage">My Dashboard</Link></li>
            )}
            <li className="nav__item"><Link className="nav__link" to="/about">About</Link></li>
            <li className="nav__item"><button onClick={handleLogout} className="nav__link nav__link--btn">Logout</button></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Header;
