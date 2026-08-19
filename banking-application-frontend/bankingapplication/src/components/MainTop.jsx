import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MainTop.css';
import { AuthGuard } from '../utils/authGuard';



const MainTop = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userType, setUserType] = useState(null);

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
  }, []);

  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const dashboardPath = userType === 'admin' ? '/adminpage' : '/userpage';

 

  return (
    <section className="hero" aria-label="Welcome section">
      {/* Ambient animated gradient */}
      <div className="hero__ambient" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__eyebrow">{greeting} &nbsp;·&nbsp; InterBankHub</p>

        <h1 className="hero__headline">
          All your banks.<br />One <em>secure</em> platform.
        </h1>

        <p className="hero__sub">
          Connect and manage accounts from multiple banks effortlessly.
          Experience unified banking like never before.
        </p>

        <p className="hero__tagline">
          Banking simplified. Security amplified.
        </p>

        <div className="hero__cta">
          {isSignedIn ? (
            <Link to={dashboardPath} className="hero__cta-primary">
              <span>Go to my Dashboard</span>
            </Link>
          ) : (
            <>
              <Link to="/signin" className="hero__cta-primary">
                <span>Sign In</span>
              </Link>
              <Link to="/signup" className="hero__cta-secondary">
                <span>Create Account</span>
              </Link>
            </>
          )}
        </div>
        
      </div>

      {/* Breathing scroll indicator */}
      <div className="hero__scroll-hint" aria-hidden="true">
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
};

export default MainTop;

       