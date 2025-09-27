
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { FaUniversity } from 'react-icons/fa';


const Header = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userType, setUserType] = useState(null); // Track user type
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check on mount and on route change
    const token = sessionStorage.getItem('userToken');
    const type = sessionStorage.getItem('userType');
    setIsSignedIn(!!token);
    setUserType(type);
    
    // Listen for changes in sessionStorage (e.g., from other tabs or after login)
    const handleStorage = () => {
      const currentToken = sessionStorage.getItem('userToken');
      const currentType = sessionStorage.getItem('userType');
      setIsSignedIn(!!currentToken);
      setUserType(currentType);
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [location]);

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('adminId');
    setIsSignedIn(false);
    setUserType(null);
    navigate('/');
    // For cross-tab sync
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <nav className="nav">

  <h1 className='nav__logo'><FaUniversity style={{width:'70px',height:'50px', marginRight: '10px', verticalAlign: 'middle' }} />AllBanksOne</h1>
      
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
              <li className="nav__item"><Link className="nav__link" to="/adminpage">Admin Dashboard</Link></li>
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
