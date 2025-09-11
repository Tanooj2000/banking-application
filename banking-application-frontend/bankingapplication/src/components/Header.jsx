
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Header.css';


const Header = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check on mount
    setIsSignedIn(!!sessionStorage.getItem('userToken'));
    // Listen for changes in sessionStorage (e.g., from other tabs or after login)
    const handleStorage = () => {
      setIsSignedIn(!!sessionStorage.getItem('userToken'));
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    setIsSignedIn(false);
    navigate('/');
    // For cross-tab sync
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">BankingApplication</div>
      <div className="navbar-links">
        {!isSignedIn ? (
          <>
            <Link to="/signin">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        ) : (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        )}
      </div>
    </nav>
  );
};

export default Header;
