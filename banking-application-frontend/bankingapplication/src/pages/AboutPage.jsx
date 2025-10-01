import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <>
      <Header />
      <div className="about-bg-gradient">
        <div className="about-container">
          <div className="about-hero">
            <h1 className="about-title">About InterBankHub</h1>
            <p className="about-subtitle">Your One-Stop Solution for Modern Banking</p>
          </div>
          <div className="about-content">
            <div className="about-section">
              <h2>Who We Are</h2>
              <p>
                AllBanksOne is a next-generation digital banking platform designed to bring all your banking needs under one roof. We connect users with multiple banks, offering seamless account management, secure transactions, and a unified experience for both individuals and administrators.
              </p>
            </div>
            <div className="about-section">
              <h2>Our Mission</h2>
              <p>
                To empower users and banks with innovative technology, making banking simpler, safer, and more accessible for everyone. We believe in transparency, security, and customer-centric solutions.
              </p>
            </div>
            <div className="about-section">
              <h2>Why Choose Us?</h2>
              <ul>
                <li>Unified dashboard for all your accounts</li>
                <li>Advanced security and privacy controls</li>
                <li>Modern, intuitive user experience</li>
                <li>24/7 support and guidance</li>
                <li>Trusted by leading banks and thousands of users</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
