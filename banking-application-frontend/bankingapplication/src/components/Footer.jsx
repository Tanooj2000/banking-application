
import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-main">
      <small>&copy; 2025 Banking Application. All rights reserved.</small>
      <div className="footer-contact">
        <span>Contact us: </span>
        <a href="mailto:support@bankingapp.com">support@bankingapp.com</a>
        <span> | </span>
        <a href="tel:+18001234567">+1 800 123 4567</a>
      </div>
    </div>
  </footer>
);

export default Footer;
