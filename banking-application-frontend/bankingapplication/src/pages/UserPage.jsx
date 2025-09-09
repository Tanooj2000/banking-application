
import React, { useState } from 'react';
import './UserPage.css';
import sbiImg from '../assets/SBI.webp';
import hdfcImg from '../assets/HDFC.webp';
import iciciImg from '../assets/ICICI.webp';
import pnbImg from '../assets/PUNJAB NATIONAL.webp';
import axisImg from '../assets/AXIS.webp';
import bobImg from '../assets/BANK OF BORODA.png';
import kotakImg from '../assets/KOTAKMAHINDRA.png';
import canaraImg from '../assets/CANARA.jpg';
import unionImg from '../assets/UNIONBANK.webp';

// Example bank data
const BANKS = [
  {
    name: 'State Bank of India',
    city: 'Mumbai',
    type: 'Public',
    image: sbiImg,
  },
  {
    name: 'HDFC Bank',
    city: 'Delhi',
    type: 'Private',
    image: hdfcImg,
  },
  {
    name: 'ICICI Bank',
    city: 'Bangalore',
    type: 'Private',
    image: iciciImg,
  },
  {
    name: 'Punjab National Bank',
    city: 'Delhi',
    type: 'Public',
    image: pnbImg,
  },
  {
    name: 'Axis Bank',
    city: 'Mumbai',
    type: 'Private',
    image: axisImg,
  },
  {
    name: 'Bank of Baroda',
    city: 'Ahmedabad',
    type: 'Public',
    image: bobImg,
  },
  {
    name: 'Kotak Mahindra Bank',
    city: 'Bangalore',
    type: 'Private',
    image: kotakImg,
  },
  {
    name: 'Canara Bank',
    city: 'Bangalore',
    type: 'Private',
    image: canaraImg,
  },
  {
    name: 'Union Bank',
    city: 'Bangalore',
    type: 'Private',
    image: unionImg,
  },
];

const getUniqueCities = (banks) => [
  ...new Set(banks.map((bank) => bank.city)),
];

const UserPage = () => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const cities = getUniqueCities(BANKS);

  const filteredBanks = BANKS.filter((bank) => {
    const matchesSearch = bank.name.toLowerCase().includes(search.toLowerCase());
    const matchesCity = city ? bank.city === city : true;
    return matchesSearch && matchesCity;
  });

  return (
    <>
      <h2 style={{ textAlign: 'center', marginBottom: 18, color: '#222' }}>Welcome to the User Page!</h2>
      <div className="userpage-searchbar">
        <input
          type="text"
          placeholder="Search banks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '350px' }}
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="userpage-bankgrid">
        {filteredBanks.length === 0 ? (
          <p>No banks found.</p>
        ) : (
          <div className="userpage-grid">
            {filteredBanks.map((bank, idx) => (
              <div key={idx} className="userpage-bankcard">
                <img
                  src={bank.image}
                  alt={bank.name + ' logo'}
                />
                <div>
                  <strong>{bank.name}</strong> <br />
                  <span>Type: {bank.type}</span> <br />
                  <span>City: {bank.city}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UserPage;