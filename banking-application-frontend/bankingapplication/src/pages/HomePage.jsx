
import Header from '../components/Header';
import Footer from '../components/Footer';
import MainTop from '../components/MainTop';
import MainBottom from '../components/MainBottom';
import './HomePage.css';

import image from '../assets/image.png';
import React, { useEffect, useRef } from 'react';

const HomePage = () => {
 
  return (
    <div className="home-root">
      <Header />
      <main className="home-main">
        <div className="main-content">
          <MainTop />
          <MainBottom />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;