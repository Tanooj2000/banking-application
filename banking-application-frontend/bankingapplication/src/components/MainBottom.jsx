import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiCheckCircle, FiActivity } from 'react-icons/fi';
import './MainBottom.css';

// Import banking assets
import hdfcBank from '../assets/banks/hdfc-bank.webp';
import iciciBank from '../assets/banks/icici-bank.webp';
import jpmorgan from '../assets/banks/jpmorgan-chase.webp';
import wellsFargo from '../assets/banks/wells-fargo.webp';
import hsbc from '../assets/banks/hsbc.webp';
import citibank from '../assets/banks/citibank.webp';
import axisBank from '../assets/banks/axis-bank.webp';
import bankOfAmerica from '../assets/banks/bank-of-america.webp';
import barclays from '../assets/banks/barclays.webp';
import capitalone from '../assets/banks/capital-one.webp';
import pncBank from '../assets/banks/pnc-bank.webp';
import sbiBank from '../assets/banks/state-bank-of-india.webp';

const trustFeatures = [
  {
    Icon: FiShield,
    label: 'Unmatched Security Standards',
    desc: 'Bank-grade encryption and multi-layer authentication protect your financial data across all connected institutions. Your money, your data, always secure.',
  },
  {
    Icon: FiCheckCircle,
    label: 'One Platform, Every Bank',
    desc: 'Connect accounts from multiple banks in one unified dashboard. No more juggling between apps or websites - manage everything seamlessly.',
  },
  {
    Icon: FiActivity,
    label: 'Real-time Intelligence',
    desc: 'Live account monitoring, instant notifications, and smart insights help you make informed financial decisions across all your banking relationships.',
  },
];

const marqueeItems = [
  'PCI DSS LEVEL 1 CERTIFIED',
  'ISO 27001 COMPLIANT',
  'OPEN BANKING READY',
  'MULTI-BANK CONNECTIVITY',
  'REAL-TIME FRAUD PROTECTION',
  'ENCRYPTED DATA TRANSMISSION',
  'REGULATORY COMPLIANT',
];

const supportedBanks = [
  { name: 'HDFC Bank', logo: hdfcBank, region: 'India' },
  { name: 'ICICI Bank', logo: iciciBank, region: 'India' },
  { name: 'JPMorgan Chase', logo: jpmorgan, region: 'USA' },
  { name: 'Wells Fargo', logo: wellsFargo, region: 'USA' },
  { name: 'HSBC', logo: hsbc, region: 'UK' },
  { name: 'Citibank', logo: citibank, region: 'Global' },
  { name: 'Axis Bank', logo: axisBank, region: 'India' },
  { name: 'Bank of America', logo: bankOfAmerica, region: 'USA' },
  { name: 'Barclays', logo: barclays, region: 'UK' },
  { name: 'Capital One', logo: capitalone, region: 'USA' },
  { name: 'PNC Bank', logo: pncBank, region: 'USA' },
  { name: 'State Bank of India', logo: sbiBank, region: 'India' },
];

const MainBottom = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    const type = sessionStorage.getItem('userType');
    const adminData = sessionStorage.getItem('adminData');
    const loggedOut = sessionStorage.getItem('loggedOut');
    const isAdminAuth = type === 'admin' && adminData && loggedOut !== 'true';
    const isUserAuth = type === 'user' && token;
    setIsSignedIn(isAdminAuth || isUserAuth);
  }, []);

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
          <p className="section-label reveal-on-scroll">The InterBankHub advantage</p>
          <h2 className="section-heading reveal-on-scroll">
            Why banks and customers<br /><em>choose</em> InterBankHub.
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

      {/* Supported Banks Showcase */}
      <section className="banks-section" aria-label="Supported banks">
        <div className="section-inner">
          <p className="section-label reveal-on-scroll">Global connectivity</p>
          <h2 className="section-heading reveal-on-scroll">
            Banking partners<br /><em>worldwide.</em>
          </h2>
          <p className="banks-intro reveal-on-scroll">
            Connect with over 500+ leading financial institutions across the globe. 
            From local banks to international giants, manage all your accounts seamlessly.
          </p>
          <div className="banks-showcase">
            <div className="banks-grid">
              {supportedBanks.map((bank, index) => (
                <div 
                  key={bank.name} 
                  className="bank-card reveal-on-scroll"
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div className="bank-card__logo">
                    <img src={bank.logo} alt={bank.name} />
                  </div>
                  <div className="bank-card__info">
                    <h3 className="bank-card__name">{bank.name}</h3>
                    <p className="bank-card__region">{bank.region}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="banks-footer reveal-on-scroll">
              <p className="banks-footer__text">
                <strong>500+</strong> banks and financial institutions connected worldwide
              </p>
              <Link to={isSignedIn ? "/browsebank" : "/signin"} className="banks-footer__cta">
                <span>Explore More Banks</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing brand statement */}
      <section className="brand-close" aria-label="Closing statement">
        <div className="brand-close__inner reveal-on-scroll">
          <p className="brand-close__label">InterBankHub</p>
          <h2 className="brand-close__headline">
            Your banks. Unified.<br /><em>Finally simple.</em>
          </h2>
          <p className="brand-close__sub">
            Join thousands who've transformed their banking experience through our secure, multi-bank platform.
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

