
import React, { useState } from 'react';
import Footer from '../components/Footer';
import './SignUp.css';
import { signUpUser, signUpAdmin } from '../api/userApi';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUniversity, FaUserShield } from 'react-icons/fa';
import Header from '../components/Header';

const SignUp = () => {
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile) => /^[0-9]{10}$/.test(mobile);
  const validatePassword = (password) => password.length >= 6;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (userType === 'user') {
      if (!formData.name) newErrors.name = 'Full name is required';
      if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
      else if (!validateMobile(formData.mobile)) newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 6 characters long';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (userType === 'admin') {
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      else if (formData.bankName.length < 2) newErrors.bankName = 'Bank name must be at least 2 characters long';
      if (!formData.adminPassword) newErrors.adminPassword = 'Admin password is required';
      else if (!validatePassword(formData.adminPassword)) newErrors.adminPassword = 'Admin password must be at least 6 characters long';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
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
            bankname: formData.bankName,
            password: formData.adminPassword,
          };
          response = await signUpAdmin(adminPayload);
        }
        alert('Sign up successful!');
        setFormData({});
        setUserType('');
      } catch (error) {
        console.error('Submission error:', error);
        alert('An error occurred. Please try again.');
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
          <p className="signup-promo-desc">Join AllBanksOne and experience seamless, secure, and smart banking for everyone.</p>
          <button className="signup-promo-btn" onClick={() => navigate('/signin')}>
            Already have an account?
          </button>
        </div>
        <div className="signup-card-right">
          <h1>New To...... AllBanksOne?</h1>
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
                <FaUser style={{ marginRight: '6px', color: '#3949ab' }} />
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
                <FaUserShield style={{ marginRight: '6px', color: '#3949ab' }} />
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
                      <FaUser className="input-icon" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-input${errors.name ? ' error' : ''}`}
                        placeholder="Enter your full name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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
                        placeholder="Enter your mobile number"
                        value={formData.mobile || ''}
                        onChange={handleChange}
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
                      />
                    </div>
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>
                </>
              ) : (
                <>
               
                  <div className="input-group">
                    <label htmlFor="bankName">Bank Name</label>
                    <div className="input-icon-wrapper">
                      <FaUniversity className="input-icon" />
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        className={`form-input${errors.bankName ? ' error' : ''}`}
                        placeholder="Enter your bank name"
                        value={formData.bankName || ''}
                        onChange={handleChange}
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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
                        style={{ fontSize: '1.1rem', height: '48px', paddingLeft: '40px' }}
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