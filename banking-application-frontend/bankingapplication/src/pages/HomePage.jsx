import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import { getFormattedDateTime } from '../api/timeApi';

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getFormattedDateTime());
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="home-root">
      <Header />
      <main className="home-main">
        
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="greeting">{getGreeting()}.</span>
              <br />
              <span className="brand-text">Welcome to</span>
              <br />
              <span className="brand-name">InterBankHub</span>
            </h1>
            <p className="hero-subtitle">
              The future of banking. Simple, secure, and seamlessly integrated.
            </p>
            <div className="hero-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/signin')}
              >
                Get Started
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/browsebank')}
              >
                Explore Banks
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <div className="card-header">
                <div className="card-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="card-time">{currentTime}</span>
              </div>
              <div className="card-content">
                <h3>Your Banking Hub</h3>
                <div className="balance-display">
                  <span className="currency">$</span>
                  <span className="amount">12,345.67</span>
                </div>
                <div className="card-features">
                  <div className="feature">
                    <div className="feature-icon">🔒</div>
                    <span>Secure</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">⚡</div>
                    <span>Fast</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">🌐</div>
                    <span>Global</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-container">
            <h2 className="section-title">Why choose InterBankHub?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-large">🏦</div>
                <h3>Multi-Bank Access</h3>
                <p>Connect and manage multiple bank accounts from a single, unified platform.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-large">🛡️</div>
                <h3>Bank-Grade Security</h3>
                <p>Your data is protected with enterprise-level encryption and security protocols.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-large">📱</div>
                <h3>Seamless Experience</h3>
                <p>Intuitive design that works beautifully across all your devices.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-content">
            <h2 className="stats-title">Trusted by millions worldwide</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">2M+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">150+</div>
                <div className="stat-label">Partner Banks</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Countries</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to transform your banking?</h2>
            <p className="cta-subtitle">Join millions who have already made the switch to smarter banking.</p>
            <button 
              className="btn-cta"
              onClick={() => navigate('/signup')}
            >
              Create Your Account
            </button>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default HomePage;