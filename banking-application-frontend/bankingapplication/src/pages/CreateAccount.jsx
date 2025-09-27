import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLocation } from 'react-router-dom';
import './CreateAccount.css';

import { createAccount, getUserBankAccounts } from '../api/bankAccountApi';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}


const countryFields = {
  India: [
    { label: 'Full Name', name: 'fullName', type: 'text', required: true },
    { label: 'Aadhaar Number', name: 'aadhaar', type: 'text', required: true },
    { label: 'PAN Number', name: 'pan', type: 'text', required: true },
    { label: 'Mobile Number', name: 'mobile', type: 'text', required: true },
    { label: 'Email', name: 'email', type: 'email', required: true },
    { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
    { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
    { label: 'Occupation', name: 'occupation', type: 'text', required: false },
    { label: 'Address', name: 'address', type: 'textarea', required: true },
  // ID Proof Type field removed
  { label: 'Account Type', name: 'accountType', type: 'select', required: true, options: ['SAVINGS', 'CURRENT', 'SALARY', 'FIXED_DEPOSIT'] },
  { label: 'Initial Deposit (INR)', name: 'deposit', type: 'number', required: true },
  { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' },
  ],
  USA: [
    { label: 'Full Name', name: 'fullName', type: 'text', required: true },
    { label: 'SSN', name: 'ssn', type: 'text', required: true },
    { label: 'Phone Number', name: 'phone', type: 'text', required: true },
    { label: 'Email', name: 'email', type: 'email', required: true },
    { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
    { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
    { label: 'Occupation', name: 'occupation', type: 'text', required: false },
    { label: 'Address', name: 'address', type: 'textarea', required: true },
    // ID Proof Type field removed
  { label: 'Account Type', name: 'accountType', type: 'select', required: true, options: ['CHECKING', 'SAVINGS', 'MONEY_MARKET', 'CERTIFICATE_OF_DEPOSIT'] },
  { label: 'Initial Deposit (USD)', name: 'deposit', type: 'number', required: true },
  { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' },
  ],
  UK: [
    { label: 'Full Name', name: 'fullName', type: 'text', required: true },
    { label: 'National Insurance Number', name: 'nin', type: 'text', required: true },
    { label: 'Phone Number', name: 'phone', type: 'text', required: true },
    { label: 'Email', name: 'email', type: 'email', required: true },
    { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
    { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
    { label: 'Occupation', name: 'occupation', type: 'text', required: false },
    { label: 'Address', name: 'address', type: 'textarea', required: true },
    // ID Proof Type field removed
  { label: 'Account Type', name: 'accountType', type: 'select', required: true, options: ['CURRENT', 'SAVINGS', 'ISA', 'FIXED_TERM'] },
  { label: 'Initial Deposit (GBP)', name: 'deposit', type: 'number', required: true },
  { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' },
  ],
};

const CreateAccount = () => {
  const query = useQuery();
  const location = useLocation();
  const userId = location.state?.userId;
  const bankName = query.get('bank');
  const country = query.get('country') || 'India';
  const fields = countryFields[country] || countryFields['India'];

  const [formStatus, setFormStatus] = useState({ loading: false, success: null, error: null });
  const [existingAccountData, setExistingAccountData] = useState(null);
  const [isLoadingAccountData, setIsLoadingAccountData] = useState(false);

  // Define which fields should be pre-filled and disabled for existing bank account holders
  const unchangeableFields = [
    'fullName', 'dob', 'gender', 'aadhaar', 'pan', 'ssn', 'nin', 'address'
  ];

  // Fetch existing bank account data if userId is available
  useEffect(() => {
    const fetchBankAccountData = async () => {
      if (!userId) return;
      
      setIsLoadingAccountData(true);
      try {
        const bankAccounts = await getUserBankAccounts(userId);
        
        // If user has existing bank accounts, use the first one for pre-filling
        if (bankAccounts && bankAccounts.length > 0) {
          const firstAccount = bankAccounts[0];
          setExistingAccountData(firstAccount);
          console.log('Existing bank account data loaded:', firstAccount);
          
          // Show alert about pre-filled data
          alert(`✅ Your personal details have been pre-filled from your existing ${firstAccount.bank || 'bank'} account.`);
        }
      } catch (error) {
        console.error('Failed to load bank account data:', error);
        // Don't show error for this - user might be creating their first account
      } finally {
        setIsLoadingAccountData(false);
      }
    };

    fetchBankAccountData();
  }, [userId]);

  // Helper function to check if field should be disabled
  const isFieldDisabled = (fieldName) => {
    return existingAccountData && unchangeableFields.includes(fieldName);
  };

  // Helper function to get pre-filled value from existing bank account
  const getPreFilledValue = (fieldName) => {
    if (!existingAccountData) return '';
    
    // Direct mapping - bank account data should have same field names as form
    return existingAccountData[fieldName] || '';
  };

  // Group fields by logical sections
  const groups = [
    {
      title: 'Personal Information',
      names: ['fullName', 'dob', 'gender', 'occupation'],
    },
    {
      title: 'Contact Details',
      names: ['mobile', 'phone', 'email', 'address'],
    },
    {
      title: 'Identification',
      names: ['aadhaar', 'pan', 'ssn', 'nin'],
    },
    {
      title: 'Account Details',
      names: ['deposit', 'consent', 'accountType'],
    },
  ];

  // Helper to get fields for a group
  const getFieldsForGroup = (names) => fields.filter(f => names.includes(f.name));


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ loading: true, success: null, error: null });
    const form = e.target;
    const data = {};
  // Add bank info
  data.bank = bankName || '';
  // Set status to PENDING
  data.status = 'PENDING';
  // Add userId if available
  if (userId) {
    data.userId = userId;
  }
    // Add all fields
    fields.forEach(field => {
      if (field.type === 'checkbox') {
        data[field.name] = form[field.name]?.checked ? true : false;
      } else {
        data[field.name] = form[field.name]?.value || '';
      }
    });
    try {
      await createAccount(data, country);
      setFormStatus({ loading: false, success: 'Account created successfully!', error: null });
      form.reset();
    } catch (err) {
      setFormStatus({ loading: false, success: null, error: err?.response?.data?.message || 'Failed to create account.' });
    }
  };

  return (
    <>
      <Header />
      <h2 className="createaccount-title" style={{marginTop: 40}}>
        {existingAccountData ? 'Create Additional Bank Account' : 'Application For Account Creation'}
      </h2>
      <div className="createaccount-info-line">
        Bank: <strong>{bankName || 'N/A'}</strong> &nbsp; | &nbsp; Country: <strong>{country}</strong>
        {existingAccountData && (
          <span style={{ marginLeft: '20px', color: '#10b981', fontWeight: '500' }}>
            ✓ Existing account holder - Personal details pre-filled from your previous account
          </span>
        )}
      </div>
      
      {isLoadingAccountData ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <div>Loading your account information...</div>
        </div>
      ) : (
        <form className="createaccount-form" style={{width: '100%', maxWidth: 900, margin: '32px auto'}} onSubmit={handleSubmit}>
          {groups.map((group, idx) => {
          const groupFields = getFieldsForGroup(group.names);
          if (groupFields.length === 0) return null;
          return (
            <div className="createaccount-form-section" key={group.title}>
              <h3 className="createaccount-section-title">{group.title}</h3>
              <div className="createaccount-form-grid">
                {groupFields.map((field) => {
                  if (field.type === 'select') {
                    const isDisabled = isFieldDisabled(field.name);
                    const preFilledValue = getPreFilledValue(field.name);
                    return (
                      <div className="createaccount-form-group" key={field.name}>
                        <label htmlFor={field.name}>
                          {field.label}
                          {isDisabled && <span style={{ color: '#10b981', fontSize: '0.8em' }}> (Pre-filled)</span>}
                        </label>
                        <select 
                          id={field.name} 
                          name={field.name} 
                          required={field.required}
                          disabled={isDisabled}
                          defaultValue={preFilledValue}
                          style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
                        >
                          <option value="">Select</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (field.type === 'textarea') {
                    const isDisabled = isFieldDisabled(field.name);
                    const preFilledValue = getPreFilledValue(field.name);
                    return (
                      <div className="createaccount-form-group" key={field.name} style={{ gridColumn: '1 / span 2' }}>
                        <label htmlFor={field.name}>
                          {field.label}
                          {isDisabled && <span style={{ color: '#10b981', fontSize: '0.8em' }}> (Pre-filled)</span>}
                        </label>
                        <textarea 
                          id={field.name} 
                          name={field.name} 
                          required={field.required} 
                          rows={3}
                          disabled={isDisabled}
                          defaultValue={preFilledValue}
                          style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
                        />
                      </div>
                    );
                  }
                  if (field.type === 'checkbox') {
                    return (
                      <div className="createaccount-form-group" key={field.name} style={{ gridColumn: '1 / span 2', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" id={field.name} name={field.name} required={field.required} />
                        <label htmlFor={field.name} style={{ marginBottom: 0 }}>{field.labelText || field.label}</label>
                      </div>
                    );
                  }
                  const isDisabled = isFieldDisabled(field.name);
                  const preFilledValue = getPreFilledValue(field.name);
                  return (
                    <div className="createaccount-form-group" key={field.name}>
                      <label htmlFor={field.name}>
                        {field.label}
                        {isDisabled && <span style={{ color: '#10b981', fontSize: '0.8em' }}> (Pre-filled)</span>}
                      </label>
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        disabled={isDisabled}
                        defaultValue={preFilledValue}
                        style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
                      />
                    </div>
                  );
                })}
              </div>
              {idx !== groups.length - 1 && <hr className="createaccount-section-divider" />}
            </div>
          );
        })}
        <button type="submit" className="createaccount-submit-btn" disabled={formStatus.loading}>
          {formStatus.loading ? 'Creating...' : 'Create Account'}
        </button>
        {formStatus.success && <div className="createaccount-success-msg">{formStatus.success}</div>}
        {formStatus.error && <div className="createaccount-error-msg">{formStatus.error}</div>}
        </form>
      )}
      <Footer />
    </>
  );
};

export default CreateAccount;
