import React, { useState } from 'react';
import './SignUp.css';
const SignUp = () => {
const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (userType === 'user') {
      // User specific validations
      if (!formData.mobile) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!validateMobile(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 6 characters long';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (userType === 'admin') {
      // Admin specific validations
      if (!formData.bankName) {
        newErrors.bankName = 'Bank name is required';
      } else if (formData.bankName.length < 2) {
        newErrors.bankName = 'Bank name must be at least 2 characters long';
      }

      if (!formData.adminPassword) {
        newErrors.adminPassword = 'Admin password is required';
      } else if (!validatePassword(formData.adminPassword)) {
        newErrors.adminPassword = 'Admin password must be at least 6 characters long';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Form submitted successfully:', formData);
        alert('Sign up successful!');
        
        // Reset form after successful submission
        setFormData({});
        setUserType('');
      } catch (error) {
        console.error('Submission error:', error);
        alert('An error occurred. Please try again.');
      }
    }
    
    setIsSubmitting(false);
  };
  const renderUserFields = () => (
    <>
      <div className="input-group">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          value={formData.email || ''}
          onChange={handleChange}
          required
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="input-group">
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          className={`form-input ${errors.mobile ? 'error' : ''}`}
          value={formData.mobile || ''}
          onChange={handleChange}
          required
        />
        {errors.mobile && <span className="error-message">{errors.mobile}</span>}
      </div>
      
      <div className="input-group">
        <input
          type="password"
          name="password"
          placeholder="Password"
          className={`form-input ${errors.password ? 'error' : ''}`}
          value={formData.password || ''}
          onChange={handleChange}
          required
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <div className="input-group">
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
          value={formData.confirmPassword || ''}
          onChange={handleChange}
          required
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>
    </>
  );

 const renderAdminFields = () => (
    <>
      <div className="input-group">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          value={formData.email || ''}
          onChange={handleChange}
          required
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="input-group">
        <input
          type="text"
          name="bankName"
          placeholder="Bank Name"
          className={`form-input ${errors.bankName ? 'error' : ''}`}
          value={formData.bankName || ''}
          onChange={handleChange}
          required
        />
        {errors.bankName && <span className="error-message">{errors.bankName}</span>}
      </div>
      
      <div className="input-group">
        <input
          type="password"
          name="adminPassword"
          placeholder="Admin Password"
          className={`form-input ${errors.adminPassword ? 'error' : ''}`}
          value={formData.adminPassword || ''}
          onChange={handleChange}
          required
        />
        {errors.adminPassword && <span className="error-message">{errors.adminPassword}</span>}
      </div>
    </>
  );
return (
    <div className="signup-container">
      <h2 className="signup-title">Signup Page</h2>
      <div className="user-type-section">
        <div className="signup-icon-container">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" 
            alt="Sign Up" 
            className="signup-icon-image"
          />
        </div>
        <p className="user-type-label">
          How do you want signup?
        </p>
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
            Admin
          </label>
        </div>
      </div>

      {userType && (
        <form onSubmit={handleSubmit} className="signup-form">
          {userType === 'user' ? renderUserFields() : renderAdminFields()}
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
  );


};
export default SignUp;