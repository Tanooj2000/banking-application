import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiCheckCircle, FiActivity } from 'react-icons/fi';
import './MainBottom.css';

const trustFeatures = [
  {
    Icon: FiShield,
    label: 'Protected Sessions',
    desc: 'End-to-end session encryption with automatic expiry controls keeps your access secure at every interaction.',
  },
  {
    Icon: FiCheckCircle,
    label: 'Verified Transfers',
    desc: 'Every transaction passes multi-layer validation before execution. No movement happens without full confirmation.',
  },
  {
    Icon: FiActivity,
    label: 'Real-time Monitoring',
    desc: 'Continuous anomaly detection running around the clock. Nothing leaves or enters unaccounted.',
  },
];

const marqueeItems = [
  'SOC 2 TYPE II COMPLIANT',
  'FDIC ALIGNED OPERATIONS',
  '256-BIT ENCRYPTION',
  'REAL-TIME FRAUD DETECTION',
  'ZERO DATA BREACHES',
  'MULTI-FACTOR AUTHENTICATION',
  'INDEPENDENT SECURITY AUDITS',
];

const MainBottom = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -60px 0px' }
    );
    const items = document.querySelectorAll('.reveal-on-scroll');
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="below-fold">

      {/* Marquee strip — compliance badges scrolling left */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span className="marquee-item" key={i}>
              {item}
              <span className="marquee-sep">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Trust Features */}
      <section className="trust-section" aria-label="Platform principles">
        <div className="section-inner">
          <p className="section-label reveal-on-scroll">Built on principle</p>
          <h2 className="section-heading reveal-on-scroll">
            What we <em>refuse</em><br />to compromise on.
          </h2>
          <div className="trust-grid">
            {trustFeatures.map((f, i) => (
              <div
                className="trust-item reveal-on-scroll"
                key={f.label}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="trust-icon" aria-hidden="true"><f.Icon /></span>
                <div className="trust-text">
                  <h3 className="trust-label">{f.label}</h3>
                  <p className="trust-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Status */}
      <section className="status-section" aria-label="Platform status">
        <div className="section-inner">
          <p className="section-label reveal-on-scroll">System status</p>
          <div className="status-board reveal-on-scroll">
            <div className="status-board__header">
              <span className="status-board__title">Platform Status</span>
              <span className="status-board__operational">
                <span className="status-dot" aria-hidden="true" />
                Operational
              </span>
            </div>
            <p className="status-board__copy">
              Secure routing, transaction validation, and system checks are currently active and uninterrupted.
            </p>
            <div className="status-board__rows">
              <div className="status-board__row">
                <span className="status-board__row-label">Session Protection</span>
                <span className="status-board__row-value">Enabled</span>
              </div>
              <div className="status-board__row">
                <span className="status-board__row-label">Verification Layer</span>
                <span className="status-board__row-value">Live</span>
              </div>
              <div className="status-board__row">
                <span className="status-board__row-label">Fraud Detection</span>
                <span className="status-board__row-value">Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing brand statement */}
      <section className="brand-close" aria-label="Closing statement">
        <div className="brand-close__inner reveal-on-scroll">
          <p className="brand-close__label">InterBankHub</p>
          <h2 className="brand-close__headline">
            Your capital. Your terms.<br /><em>Our discipline.</em>
          </h2>
          <p className="brand-close__sub">
            Private banking infrastructure, built for those who expect precision.
          </p>
          <Link to="/signup" className="brand-close__cta">
            <span>Open an Account</span>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default MainBottom;

