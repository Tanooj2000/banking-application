import React, { useState } from 'react';
import './SignUp.css';
import { signUpUser, signUpAdmin } from '../api/userApi';
import UserFields from './UserFields';
import AdminFields from './AdminFields';
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
        let response;
        if (userType === 'user') {
          // Prepare user payload
          const userPayload = {
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password,
            userType: 'user',
          };
          response = await signUpUser(userPayload);
        } else if (userType === 'admin') {
          // Prepare admin payload
          const adminPayload = {
            email: formData.email,
            bankName: formData.bankName,
            password: formData.adminPassword,
            userType: 'admin',
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
          {userType === 'user' ? (
            <UserFields formData={formData} errors={errors} handleChange={handleChange} />
          ) : (
            <AdminFields formData={formData} errors={errors} handleChange={handleChange} />
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
  );


};
export default SignUp;