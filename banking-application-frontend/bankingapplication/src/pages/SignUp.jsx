import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import './SignUp.css';
import {signUpUser} from '../api/userApi';
import { signUpAdmin } from '../api/adminApi';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUniversity, FaUserShield, FaGlobe, FaPlus, FaSearch } from 'react-icons/fa';
import Header from '../components/Header';
import { validateGmail, validatePassword, validateName, validateConfirmPassword, validateMobile, validateBankName, getErrorMessage } from '../utils/validation';
import CreatableSelect from 'react-select/creatable';
const SignUp = () => {
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showAddBankPrompt, setShowAddBankPrompt] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const navigate = useNavigate();

  // Bank data by country (in real app, this would come from API)
  const banksByCountry = {
    India: [
      'HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Kotak Mahindra Bank', 
      'Axis Bank', 'Punjab National Bank', 'Canara Bank', 'Union Bank of India',
      'Bank of Baroda', 'Indian Bank', 'Central Bank of India', 'Yes Bank'
    ],
    USA: [
      'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 
      'Goldman Sachs', 'Morgan Stanley', 'US Bank', 'PNC Bank',
      'Capital One', 'TD Bank', 'Fifth Third Bank', 'Regions Bank'
    ],
    UK: [
      'HSBC', 'Barclays', 'Lloyds Banking Group', 'NatWest', 
      'Santander UK', 'Royal Bank of Scotland', 'TSB Bank',
      'Metro Bank', 'Virgin Money', 'Monzo', 'Starling Bank'
    ]
  };

  // Update available banks when country changes
  useEffect(() => {
    if (formData.country) {
      const banks = banksByCountry[formData.country] || [];
      setAvailableBanks(banks);
      // Convert to react-select format
      const bankOptions = banks.map(bank => ({ value: bank, label: bank }));
      setFilteredBanks(bankOptions);
    } else {
      setAvailableBanks([]);
      setFilteredBanks([]);
    }
    setBankSearchTerm('');
    setShowAddBankPrompt(false);
    // Reset bank selection when country changes
    setFormData(prev => ({ ...prev, bankName: '' }));
  }, [formData.country]);

  // Redirect if already signed in
  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    const storedUserType = sessionStorage.getItem('userType');
    
    if (token && storedUserType) {
      // User is already signed in, redirect to appropriate dashboard
      if (storedUserType === 'admin') {
        navigate('/adminpage', { replace: true });
      } else {
        navigate('/userpage', { replace: true });
      }
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else {
  const emailValidation = validateGmail(formData.email);
  if (!emailValidation.isValid) {
    newErrors.email = emailValidation.message;
  }
}
    if (userType === 'user') {
      if (!formData.name) newErrors.name = 'Full name is required';
      if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
      else if (!validateMobile(formData.mobile)) newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 6 characters long';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (userType === 'admin') {
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      else if (formData.bankName.length < 2) newErrors.bankName = 'Bank name must be at least 2 characters long';
      if (!formData.adminPassword) newErrors.adminPassword = 'Admin password is required';
      else if (!validatePassword(formData.adminPassword)) newErrors.adminPassword = 'Admin password must be at least 6 characters long';
    }
    
    if (userType === 'user') {
      // Name validation
      const nameValidation = validateName(formData.name);
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.message;
      }
      
      // Mobile validation
      const mobileValidation = validateMobile(formData.mobile);
      if (!mobileValidation.isValid) {
        newErrors.mobile = mobileValidation.message;
      }
      
      // Password validation
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
      
      // Confirm password validation
      const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.message;
      }
      
    } else if (userType === 'admin') {
      // Admin name validation
      if (formData.name) {
        const nameValidation = validateName(formData.name);
        if (!nameValidation.isValid) {
          newErrors.name = nameValidation.message;
        }
      }
      
      // Bank name validation
      const bankNameValidation = validateBankName(formData.bankName);
      if (!bankNameValidation.isValid) {
        newErrors.bankName = bankNameValidation.message;
      }
      
      // Admin password validation
      const passwordValidation = validatePassword(formData.adminPassword);
      if (!passwordValidation.isValid) {
        newErrors.adminPassword = passwordValidation.message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prevData => ({ ...prevData, [name]: value }));
      if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Handle bank selection from react-select
  const handleBankSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData(prevData => ({ ...prevData, bankName: selectedOption.value }));
      setBankSearchTerm(selectedOption.label);
      if (errors.bankName) setErrors({ ...errors, bankName: '' });
    } else {
      setFormData(prevData => ({ ...prevData, bankName: '' }));
      setBankSearchTerm('');
    }
  };

  // Handle adding new bank (for react-select)
  const handleCreateNewBank = (inputValue) => {
    const newBank = inputValue.trim();
    if (newBank && !availableBanks.includes(newBank)) {
      // Add to available banks (in real app, this would be API call)
      setAvailableBanks(prev => [...prev, newBank]);
      const newOption = { value: newBank, label: newBank };
      setFilteredBanks(prev => [...prev, newOption]);
      setFormData(prevData => ({ ...prevData, bankName: newBank }));
      setBankSearchTerm(newBank);
      if (errors.bankName) setErrors({ ...errors, bankName: '' });
      
      // Show success message
      setTimeout(() => {
        alert(`"${newBank}" has been added to the bank list!`);
      }, 100);
      
      return newOption;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (validateForm()) {
      try {
        let response;
        if (userType === 'user') {
          const userPayload = {
            username: formData.name,
            email: formData.email,
            phonenumber: formData.mobile,
            password: formData.password,
            userType: 'user',
          };
          response = await signUpUser(userPayload);
        } else if (userType === 'admin') {
          const adminPayload = {
            username: formData.name,
            email: formData.email,
            country: formData.country,
            bankname: formData.bankName,
            password: formData.adminPassword,
          };
          response = await signUpAdmin(adminPayload);
        }
  alert(response);
  setFormData({});
  setUserType('');
  navigate('/signin');
      } catch (error) {
        console.error('Submission error:', error);
        alert(getErrorMessage(error)); 
      }
    }
    setIsSubmitting(false);
  };

  return (
    <>    
      <Header />
    <div className="signup-bg-gradient">
      <div className="signup-card">
        <div className="signup-card-left">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" 
            alt="Sign Up" 
            className="signup-icon-image"
          />
          <h1 className="signup-promo-title">Create Your Account</h1>
          <p className="signup-promo-desc">Join InterBankHub and experience seamless, secure, and smart banking for everyone.</p>
          <button className="signup-promo-btn" onClick={() => navigate('/signin')}>
            Already have an account?
          </button>
        </div>
        <div className="signup-card-right">
          <h1>New <br /> To  InterBankHub?</h1>
          <h2 className="signup-title">Sign Up</h2>
          <div className="user-type-section">
            <p className="user-type-label">How do you want to sign up?</p>
            <div className="radio-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="user"
                  checked={userType === 'user'}
                  onChange={(e) => {
                    setUserType(e.target.value);
                    setFormData({});
                  }}
                />
                <FaUser  />
                User
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="admin"
                  checked={userType === 'admin'}
                  onChange={(e) => {
                    setUserType(e.target.value);
                    setFormData({});
                  }}
                />
                <FaUserShield  />
                Admin
              </label>
            </div>
          </div>
          {userType && (
            <form onSubmit={handleSubmit} className="signup-form">
              {userType === 'user' ? (
                <>
                  <div className="input-group">
                    <label htmlFor="name">User Name</label>
                    <div className="input-icon-wrapper">
                      <FaUser className="input-icon"  />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-input${errors.name ? ' error' : ''}`}
                        placeholder="Enter your full name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        
                      />
                    </div>
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-icon-wrapper">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input${errors.email ? ' error' : ''}`}
                        placeholder="Enter your email"
                        value={formData.email || ''}
                        onChange={handleChange}
                       
                      />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="mobile">Mobile</label>
                    <div className="input-icon-wrapper">
                      <FaPhone className="input-icon" />
                      <input
                        type="text"
                        id="mobile"
                        name="mobile"
                        className={`form-input${errors.mobile ? ' error' : ''}`}
                        placeholder="Enter mobile number"
                        value={formData.mobile || ''}
                        onChange={handleChange}
                        
                      />
                    </div>
                    {errors.mobile && <span className="error-message">{errors.mobile}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-icon-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        id="password"
                        name="password"
                        className={`form-input${errors.password ? ' error' : ''}`}
                        placeholder="Enter your password"
                        value={formData.password || ''}
                        onChange={handleChange}
                        
                      />
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-icon-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword || ''}
                        onChange={handleChange}
                        
                      />
                    </div>
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="name">Username</label>
                    <div className="input-icon-wrapper">
                      <FaUser className="input-icon" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-input${errors.name ? ' error' : ''}`}
                        placeholder="Enter your username"
                        value={formData.name || ''}
                        onChange={handleChange}
                        
                      />
                    </div>
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="country">Country</label>
                    <div className="input-icon-wrapper">
                      <FaGlobe className="input-icon" />
                      <select
                        id="country"
                        name="country"
                        value={formData.country || ''}
                        onChange={(e) => {
                          handleChange(e);
                          // Reset bank selection when country changes
                          setFormData(prev => ({ ...prev, bankName: '' }));
                        }}
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '12px 15px 12px 40px',
                          fontSize: '14px',
                          border: `2px solid ${errors.country ? '#dc3545' : '#e0e0e0'}`,
                          borderRadius: '6px',
                          backgroundColor: '#fff',
                          color: '#333',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          backgroundSize: '16px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#007bff';
                          e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.country ? '#dc3545' : '#e0e0e0';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="" disabled style={{ color: '#999' }}>
                          Select your country
                        </option>
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                      </select>
                    </div>
                    {errors.country && <span className="error-message">{errors.country}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="bankName">Bank Name</label>
                    <div className="react-select-wrapper">
                      <FaUniversity className="select-icon" />
                      <CreatableSelect
                        id="bankName"
                        name="bankName"
                        options={filteredBanks}
                        value={filteredBanks.find(option => option.value === formData.bankName) || null}
                        onChange={handleBankSelect}
                        onCreateOption={handleCreateNewBank}
                        isSearchable={true}
                        isClearable={true}
                        isDisabled={!formData.country}
                        placeholder={formData.country ? "Search or select your bank..." : "Select country first"}
                        noOptionsMessage={({ inputValue }) => 
                          inputValue ? `No banks found matching "${inputValue}"` : "Start typing to search banks..."
                        }
                        formatCreateLabel={(inputValue) => `Add "${inputValue}" as new bank`}
                        className={`react-select-container ${errors.bankName ? 'react-select--error' : ''}`}
                        classNamePrefix="react-select"
                      />
                    </div>
                    {errors.bankName && <span className="error-message">{errors.bankName}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-icon-wrapper">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input${errors.email ? ' error' : ''}`}
                        placeholder="Enter your email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        
                      />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="adminPassword">Admin Password</label>
                    <div className="input-icon-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type="password"
                        id="adminPassword"
                        name="adminPassword"
                        className={`form-input${errors.adminPassword ? ' error' : ''}`}
                        placeholder="Enter admin password"
                        value={formData.adminPassword || ''}
                        onChange={handleChange}
                       
                      />
                    </div>
                    {errors.adminPassword && <span className="error-message">{errors.adminPassword}</span>}
                  </div>
                </>
              )}
              <button
                type="submit"
                className={`submit-button ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </div>
       
    </div>
    <Footer />
    </>
  );
};
export default SignUp;