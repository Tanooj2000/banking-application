import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import { FaUniversity } from 'react-icons/fa';
import { HiSun, HiMoon, HiMenuAlt3, HiX } from 'react-icons/hi';
import { AuthGuard } from '../utils/authGuard';

const Header = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('ibh-theme') || 'dark'
  );
  const location = useLocation();

  // Persist + apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ibh-theme', theme);
  }, [theme]);

  // Scroll detection for nav background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Auth detection from central guard
  useEffect(() => {
    const syncAuthState = () => {
      const isAdminAuth = AuthGuard.isAdminAuthenticated();
      const isUserAuth = AuthGuard.isAuthenticated() && AuthGuard.getUserType() !== 'admin';
      setIsSignedIn(isAdminAuth || isUserAuth);
      setUserType(isAdminAuth ? 'admin' : isUserAuth ? 'user' : null);
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener('storage', syncAuthState);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    if (userType === 'admin' || AuthGuard.isAdminAuthenticated()) {
      AuthGuard.logoutAdmin();
    } else {
      await AuthGuard.logout();
    }
    setIsSignedIn(false);
    setUserType(null);
    window.dispatchEvent(new Event('storage'));
  };

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const isHome = location.pathname === '/';
  const dashboardPath = userType === 'admin' ? '/adminpage' : '/userpage';

  const NavLinks = ({ mobile = false }) => (
    <>
      {!isSignedIn ? (
        <>
          {!isHome && <li><Link className="nav__link" to="/">Home</Link></li>}
          <li><Link className="nav__link" to="/about">About</Link></li>
          <li><Link className="nav__link nav__link--signin" to="/signin">Sign In</Link></li>
          <li><Link className="nav__link nav__link--signup" to="/signup"><span>Sign Up</span></Link></li>
        </>
      ) : (
        <>
          {!isHome && <li><Link className="nav__link" to="/">Home</Link></li>}
          <li><Link className="nav__link" to={dashboardPath}>My Dashboard</Link></li>
          <li><Link className="nav__link" to="/about">About</Link></li>
          <li>
            <button onClick={handleLogout} className="nav__link nav__link--logout">
              Logout
            </button>
          </li>
        </>
      )}
      {!mobile && (
        <li>
          <button className="nav__theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <HiSun /> : <HiMoon />}
          </button>
        </li>
      )}
    </>
  );

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <Link to="/" className="nav__logo">
        <div className="logo-wrapper">
          <FaUniversity className="logo-icon" />
          <span className="logo-text">Inter<span>BANK</span>Hub</span>
        </div>
      </Link>

      {/* Desktop links */}
      <ul className="nav__links nav__links--desktop">
        <NavLinks />
      </ul>

      {/* Mobile controls */}
      <div className="nav__mobile-controls">
        <button className="nav__theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <HiSun /> : <HiMoon />}
        </button>
        <button
          className="nav__hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <HiX /> : <HiMenuAlt3 />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <ul className="nav__links nav__links--mobile">
          <NavLinks mobile />
        </ul>
      )}
    </nav>
  );
};

export default Header;
