import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate, useLocation } from 'react-router-dom';
import './BrowseBank.css';
import { getAvailableCountries, fetchBanks } from '../api/bankApi';
import { getUserBankAccounts } from '../api/accountApi';
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
  const [userBankAccounts, setUserBankAccounts] = useState([]); // User's existing bank accounts
  const [loadingUserAccounts, setLoadingUserAccounts] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId || sessionStorage.getItem('userId');

  const cities = getUniqueCities(banks);

  // Helper function to check if user already has account with this bank
  const hasExistingAccount = (bankName, branch) => {
    return userBankAccounts.some(account => 
      account.bank === bankName && account.branch === branch
    );
  };

  // Load user's existing bank accounts
  useEffect(() => {
    const loadUserBankAccounts = async () => {
      if (!userId) return;
      
      setLoadingUserAccounts(true);
      try {
        const accounts = await getUserBankAccounts(userId);
        setUserBankAccounts(accounts || []);
      } catch (err) {
        console.error('Failed to load user bank accounts:', err);
        setUserBankAccounts([]);
      } finally {
        setLoadingUserAccounts(false);
      }
    };
    
    loadUserBankAccounts();
  }, [userId]);

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

  // Get unique banks (group by bankName and show one representative)
  const getUniqueBanks = (banksArray) => {
    const bankGroups = {};
    
    banksArray.forEach((bank) => {
      if (!bank || !bank.bankName) return;
      
      const key = bank.bankName.toLowerCase();
      if (!bankGroups[key]) {
        bankGroups[key] = {
          ...bank,
          branchCount: 1,
          cities: [bank.city],
          branches: [{ branch: bank.branch, city: bank.city, code: bank.code }]
        };
      } else {
        bankGroups[key].branchCount++;
        if (!bankGroups[key].cities.includes(bank.city)) {
          bankGroups[key].cities.push(bank.city);
        }
        bankGroups[key].branches.push({ branch: bank.branch, city: bank.city, code: bank.code });
      }
    });
    
    return Object.values(bankGroups);
  };

  const filteredBanks = getUniqueBanks(banks).filter((bank) => {
    const matchesSearch = bank.bankName.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !city || bank.cities.includes(city);
    
    return matchesSearch && matchesCity;
  });

  const handleCreate = (bankName, branches) => {
    navigate(`/createaccount?country=${encodeURIComponent(country)}&bank=${encodeURIComponent(bankName)}`, {
      state: { 
        userId: userId,
        branches: branches,
        selectedCountry: country
      }
    });
  };

  return (
    <div className="userpage-bg-gradient">
      <Header />
      <div className="page-header">
        <h1 className="page-title">Select Your Bank</h1>
        <p className="page-subtitle">Choose from our network of trusted financial institutions to begin your banking journey</p>
      </div>
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <label htmlFor="bank-search">Find Your Bank</label>
            <input
              id="bank-search"
              type="text"
              placeholder="Search by bank name or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="country-select">Country</label>
              <select 
                id="country-select"
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
            </div>
            
            <div className="filter-group">
              <label htmlFor="city-select">City</label>
              <select 
                id="city-select"
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
            <h3>No Banks Available</h3>
            <p>We couldn't find any banking institutions matching your criteria. Please try adjusting your search or location filters.</p>
          </div>
        ) : (
          <div className="userpage-grid">
            {filteredBanks.map((bank, idx) => {
              const hasAnyAccount = bank.branches.some(branch => 
                hasExistingAccount(bank.bankName, branch.branch)
              );
              
              return (
                <div
                  key={bank.id || idx}
                  className={`userpage-bankcard ${hasAnyAccount ? 'has-existing-account' : ''}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  title={hasAnyAccount ? 'You have existing accounts with this bank' : 'Click to create account'}
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
                    {hasAnyAccount && (
                      <div className="existing-account-badge">
                        ✓ Active Customer
                      </div>
                    )}
                  </div>
                  
                  <div className="bank-card-content">
                    <h3 className="bank-name">{bank.bankName}</h3>
                    
                    <div className="bank-details">
                      <div className="bank-detail-item">
                        <span className="detail-label">Branches:</span>
                        <span className="detail-value">{bank.branchCount} Available</span>
                      </div>
                      <div className="bank-detail-item">
                        <span className="detail-label">Locations:</span>
                        <span className="detail-value">{bank.cities.length > 1 ? `${bank.cities.length} Cities` : bank.cities[0]}</span>
                      </div>
                      <div className="bank-detail-item">
                        <span className="detail-label">Country:</span>
                        <span className="detail-value">{country}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bank-card-footer">
                    <button
                      className={`create-account-btn ${hoveredIdx === idx ? 'visible' : ''}`}
                      onClick={() => handleCreate(bank.bankName, bank.branches)}
                    >
                      <span className="btn-icon">{hasAnyAccount ? '→' : '+'}</span>
                      {hasAnyAccount ? 'Manage Accounts' : 'Create Account'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BrowseBank;