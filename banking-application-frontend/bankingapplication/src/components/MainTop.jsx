import React from 'react';
import './MainTop.css';
import { getFormattedDateTime } from '../api/timeApi';

const MainTop = () => {
  const dateString = getFormattedDateTime();
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  else if (hour >= 17 && hour < 24) greeting = 'Good Evening';

  return (
    <div className="main-top">
      <div className="main-top-left">
        <div className="main-top-welcome">{greeting}! Welcome to Banking Application</div>
        <div className="main-top-sub">We make your banking easy and safety</div>
        <div className="main-top-keywords">
          <span className="keyword-box">EASY</span>
          <span className="keyword-box">SECURE</span>
          <span className="keyword-box">SAFETY</span>
        </div>
      </div>
      <div className="main-top-right">
        <span className="main-top-text">{dateString}</span>
      </div>
      <div className="float-bubbles">
        <span className="float-bubble b1"></span>
        <span className="float-bubble b2"></span>
        <span className="float-bubble b3"></span>
        <span className="float-bubble b4"></span>
        <span className="float-bubble b5"></span>
        <span className="float-bubble b6"></span>
      </div>
    </div>
  );
};

export default MainTop;
