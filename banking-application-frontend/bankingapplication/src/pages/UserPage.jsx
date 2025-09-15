
import React, { useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
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
import Footer from '../components/Footer';

// Example bank data with country
const BANKS = [
  {
    name: 'State Bank of India',
    city: 'Mumbai',
    country: 'India',
    type: 'Public',
    image: sbiImg,
  },
  {
    name: 'HDFC Bank',
    city: 'Delhi',
    country: 'India',
    type: 'Private',
    image: hdfcImg,
  },
  {
    name: 'ICICI Bank',
    city: 'Bangalore',
    country: 'India',
    type: 'Private',
    image: iciciImg,
  },
  {
    name: 'Punjab National Bank',
    city: 'Delhi',
    country: 'India',
    type: 'Public',
    image: pnbImg,
  },
  {
    name: 'Axis Bank',
    city: 'Mumbai',
    country: 'India',
    type: 'Private',
    image: axisImg,
  },
  {
    name: 'Bank of Baroda',
    city: 'Ahmedabad',
    country: 'India',
    type: 'Public',
    image: bobImg,
  },
  {
    name: 'Kotak Mahindra Bank',
    city: 'Bangalore',
    country: 'India',
    type: 'Private',
    image: kotakImg,
  },
  {
    name: 'Canara Bank',
    city: 'Bangalore',
    country: 'India',
    type: 'Private',
    image: canaraImg,
  },
  {
    name: 'Union Bank',
    city: 'Bangalore',
    country: 'India',
    type: 'Private',
    image: unionImg,
  },
  // Example for USA
  {
    name: 'Bank of America',
    city: 'New York',
    country: 'USA',
    type: 'Private',
    image: sbiImg,
  },
  {
    name: 'Chase Bank',
    city: 'Chicago',
    country: 'USA',
    type: 'Private',
    image: hdfcImg,
  },
  // Example for UK
  {
    name: 'HSBC',
    city: 'London',
    country: 'UK',
    type: 'Private',
    image: iciciImg,
  },
  {
    name: 'Barclays',
    city: 'London',
    country: 'UK',
    type: 'Private',
    image: pnbImg,
  },
];

const getUniqueCities = (banks) => [
  ...new Set(banks.map((bank) => bank.city)),
];



const COUNTRIES = ['India', 'USA', 'UK'];

const UserPage = () => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();

  const cities = getUniqueCities(BANKS.filter(b => b.country === country));

  const filteredBanks = BANKS.filter((bank) => {
    const matchesSearch = bank.name.toLowerCase().includes(search.toLowerCase());
    const matchesCity = city ? bank.city === city : true;
    const matchesCountry = country ? bank.country === country : true;
    return matchesSearch && matchesCity && matchesCountry;
  });

  const handleCreate = (bankName) => {
    navigate(`/createaccount?country=${encodeURIComponent(country)}&bank=${encodeURIComponent(bankName)}`);
  };

  return (
    <div className="userpage-bg-gradient">
      <Header />
      <h2 style={{ textAlign: 'center', marginBottom: 18, color: '#222' }}>Welcome to the User Page!</h2>
      <div className="userpage-searchbar">
        <input
          type="text"
          placeholder="Search banks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '450px' }}
        />
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setCity('');
          }}
        >
          {COUNTRIES.map((ctry) => (
            <option key={ctry} value={ctry}>{ctry}</option>
          ))}
        </select>
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
              <div
                key={idx}
                className="userpage-bankcard"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ position: 'relative' }}
              >
                <img
                  src={bank.image}
                  alt={bank.name + ' logo'}
                />
                <div>
                  <strong>{bank.name}</strong> <br />
                  <span>Type: {bank.type}</span> <br />
                  <span>City: {bank.city}</span>
                  {hoveredIdx === idx && (
                    <button
                      className="userpage-create-btn"
                      onClick={() => handleCreate(bank.name)}
                    >
                      Create
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserPage;