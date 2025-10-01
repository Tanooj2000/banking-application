
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate, useLocation } from 'react-router-dom';
import './BrowseBank.css';
import { getAvailableCountries, fetchBanks } from '../api/bankApi';
import Footer from '../components/Footer';

// Import default bank image for fallback
import defaultBankImg from '../assets/bank-icon.jpg';

const getUniqueCities = (banks) => [
  ...new Set(banks.map((bank) => bank.city)),
];

// Helper function to get bank image based on bank name
function getBankImage(bankName) {
  if (!bankName) return defaultBankImg;
  
  // Convert bank name to match your file naming convention in assets/banks/
  const fileName = bankName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with single hyphen
    .replace(/[^\w\-]/g, '')        // Remove special characters except hyphens
    .replace(/\-+/g, '-')           // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens
  
  console.log(`Loading image for bank: "${bankName}" -> "${fileName}.webp"`); // Debug log
  
  try {
    return new URL(`../assets/banks/${fileName}.webp`, import.meta.url).href;
  } catch (error) {
    console.warn(`Could not load image for bank: ${bankName} (${fileName}.webp)`, error);
    return defaultBankImg;
  }
}

const BrowseBank = () => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [countries, setCountries] = useState(['India']); // Dynamic countries
  const [banks, setBanks] = useState([]); // Dynamic banks
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId || sessionStorage.getItem('userId');

  const cities = getUniqueCities(banks);

  // Load countries on component mount (synchronous now)
  useEffect(() => {
    const availableCountries = getAvailableCountries();
    setCountries(availableCountries);
  }, []);

  // Load banks when country changes
  useEffect(() => {
    const loadBanks = async () => {
      if (!country) return;
      
      setIsLoading(true);
      setError('');
      try {
        const banksData = await fetchBanks(country);
        setBanks(banksData);
      } catch (err) {
        setError('Failed to load banks. Please try again.');
        setBanks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBanks();
  }, [country]);

  const filteredBanks = banks.filter((bank) => {
    // Safety check: ensure bank.bankName exists before calling toLowerCase
    if (!bank || !bank.bankName) {
      return false;
    }
    
    const matchesSearch = bank.bankName.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !city || bank.city === city;
    
    return matchesSearch && matchesCity;
  });

  const handleCreate = (bankName) => {
    navigate(`/createaccount?country=${encodeURIComponent(country)}&bank=${encodeURIComponent(bankName)}`, {
      state: { userId: userId }
    });
  };

  return (
    <div className="userpage-bg-gradient">
      <Header />
      <div className="page-header">
        <h1 className="page-title">Browse Banks</h1>
        <p className="page-subtitle">Find and create accounts with trusted banking partners</p>
      </div>
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search banks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-controls">
            <select 
              value={country} 
              onChange={(e) => {
                setCountry(e.target.value);
                setCity(''); // Reset city when country changes
              }}
              className="filter-select"
              disabled={isLoading}
            >
              {countries.map((ctry) => <option key={ctry} value={ctry}>{ctry}</option>)}
            </select>
            
            <select 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="filter-select"
            >
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="userpage-bankgrid">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading banks...</p>
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <h3>No banks found</h3>
            <p>Try adjusting your search criteria or select a different location.</p>
          </div>
        ) : (
          <div className="userpage-grid">
            {filteredBanks.map((bank, idx) => (
              <div
                key={bank.id || idx}
                className="userpage-bankcard"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="bank-card-header">
                  <img
                    src={getBankImage(bank.bankName)}
                    alt={bank.bankName + ' logo'}
                    className="bank-logo"
                    onError={(e) => {
                      // Simple fallback to default image if any loading fails
                      if (e.target.src !== defaultBankImg) {
                        e.target.src = defaultBankImg;
                      }
                    }}
                  />
                </div>
                
                <div className="bank-card-content">
                  <h3 className="bank-name">{bank.bankName}</h3>
                  
                  <div className="bank-details">
                    <div className="bank-detail-item">
                      <span className="detail-label">Branch:</span>
                      <span className="detail-value">{bank.branch}</span>
                    </div>
                    <div className="bank-detail-item">
                      <span className="detail-label">City:</span>
                      <span className="detail-value">{bank.city}</span>
                    </div>
                    <div className="bank-detail-item">
                      <span className="detail-label">Code:</span>
                      <span className="detail-value">{bank.code}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bank-card-footer">
                  <button
                    className={`create-account-btn ${hoveredIdx === idx ? 'visible' : ''}`}
                    onClick={() => handleCreate(bank.bankName)}
                  >
                    <span className="btn-icon">+</span>
                    Create Account
                  </button>
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

export default BrowseBank;