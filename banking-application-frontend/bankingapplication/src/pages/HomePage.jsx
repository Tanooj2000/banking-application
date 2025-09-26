import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MainTop from '../components/MainTop';
import MainBottom from '../components/MainBottom';
import './HomePage.css';

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