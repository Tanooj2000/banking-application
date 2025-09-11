import React from 'react';

const UserFields = ({ formData, errors, handleChange }) => (
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
        name="phone"
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

export default UserFields;
