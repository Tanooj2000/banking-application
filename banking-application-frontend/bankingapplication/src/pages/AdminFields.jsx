import React from 'react';

const AdminFields = ({ formData, errors, handleChange }) => (
  <>
    <div className="input-group">
      <input
        type="name"
        name="name"
        placeholder="FullName"
        className={`form-input ${errors.email ? 'error' : ''}`}
        value={formData.name || ''}
        onChange={handleChange}
        required
      />
      {errors.name && <span className="error-message">{errors.name}</span>}
    </div>
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

export default AdminFields;
