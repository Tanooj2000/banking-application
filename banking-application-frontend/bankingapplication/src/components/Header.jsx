
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { FaUniversity } from 'react-icons/fa';


const Header = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check on mount and on route change
    const token = sessionStorage.getItem('userToken');
    setIsSignedIn(!!token);
    // If signed in and navigating to Home or About, log out
    if (token && (location.pathname === '/' || location.pathname === '/about')) {
      sessionStorage.removeItem('userToken');
      setIsSignedIn(false);
      // For cross-tab sync
      window.dispatchEvent(new Event('storage'));
    }
    // Listen for changes in sessionStorage (e.g., from other tabs or after login)
    const handleStorage = () => {
      setIsSignedIn(!!sessionStorage.getItem('userToken'));
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [location]);

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    setIsSignedIn(false);
    navigate('/');
    // For cross-tab sync
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <nav className="nav">

  <h1 className='nav__logo'><FaUniversity style={{ marginRight: '10px', verticalAlign: 'middle' }} />AllBanksOne</h1>
      
      <ul className="nav__links">
        <li className="nav__item"><Link className="nav__link" to="/">Home</Link></li>
        <li className="nav__item"><Link className="nav__link" to="/about">About</Link></li>
        {!isSignedIn ? (
          <>
            <li className="nav__item"><Link className="nav__link" to="/signin">Sign In</Link></li>
            <li className="nav__item"><Link className="nav__link " to="/signup">Sign Up</Link></li>
          </>
        ) : (
          <li className="nav__item"><button onClick={handleLogout} className="nav__link nav__link--btn">Logout</button></li>
        )}
      </ul>
    </nav>
  );
};

export default Header;
