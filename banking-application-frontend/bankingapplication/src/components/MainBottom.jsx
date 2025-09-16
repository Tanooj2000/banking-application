


import React, { useState, useEffect } from 'react';
import bank1 from '../assets/bank-1.jpg';
import bank4 from '../assets/leftpanel.jpg';
import bank3 from '../assets/bank-3.jpg';
import './MainBottom.css';

const images = [bank1, bank4, bank3];


const MainBottom = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className='main-bottom'>
    <div className="main-bottom slideshow-container">
      <img
        src={images[index]}
        alt={`slide-${index}`}
        className="mainbottom-image"
      />
      <div className="mainbottom-indicators">
        {images.map((_, i) => (
          <span
            key={i}
            className={`mainbottom-dot${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
    </div>
  );
};

export default MainBottom;
 