import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLocation } from 'react-router-dom';
import './CreateAccount.css';

import { createAccount } from '../api/createAccountApi';

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
    { label: 'ID Proof Type', name: 'idProofType', type: 'select', required: true, options: ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving License'] },
    { label: 'Photo ID Upload', name: 'photoId', type: 'file', required: true },
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
    { label: 'ID Proof Type', name: 'idProofType', type: 'select', required: true, options: ['Passport', 'Driving License', 'State ID', 'Social Security Card'] },
    { label: 'Photo ID Upload', name: 'photoId', type: 'file', required: true },
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
    { label: 'ID Proof Type', name: 'idProofType', type: 'select', required: true, options: ['Passport', 'Driving License', 'National ID Card', 'Residence Permit'] },
    { label: 'Photo ID Upload', name: 'photoId', type: 'file', required: true },
    { label: 'Initial Deposit (GBP)', name: 'deposit', type: 'number', required: true },
    { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' },
  ],
};

const CreateAccount = () => {
  const query = useQuery();
  const bankName = query.get('bank');
  const country = query.get('country') || 'India';
  const fields = countryFields[country] || countryFields['India'];

  const [formStatus, setFormStatus] = useState({ loading: false, success: null, error: null });

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
      names: ['aadhaar', 'pan', 'ssn', 'nin', 'photoId'],
    },
    {
      title: 'Account Details',
      names: ['deposit', 'consent'],
    },
  ];

  // Helper to get fields for a group
  const getFieldsForGroup = (names) => fields.filter(f => names.includes(f.name));


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ loading: true, success: null, error: null });
    const form = e.target;
    const formData = new FormData();
    // Add bank and country info
    formData.append('bank', bankName || '');
    formData.append('country', country);
    // Add all fields
    fields.forEach(field => {
      if (field.type === 'file') {
        if (form[field.name]?.files?.[0]) {
          formData.append(field.name, form[field.name].files[0]);
        }
      } else if (field.type === 'checkbox') {
        formData.append(field.name, form[field.name]?.checked ? 'true' : 'false');
      } else {
        formData.append(field.name, form[field.name]?.value || '');
      }
    });
    try {
      //await createAccount(formData);
      setFormStatus({ loading: false, success: 'Account created successfully!', error: null });
      form.reset();
    } catch (err) {
      setFormStatus({ loading: false, success: null, error: err?.response?.data?.message || 'Failed to create account.' });
    }
  };

  return (
    <>
      <Header />
      <h2 className="createaccount-title" style={{marginTop: 40}}>Application For Account Creation</h2>
      <div className="createaccount-info-line">
        Bank: <strong>{bankName || 'N/A'}</strong> &nbsp; | &nbsp; Country: <strong>{country}</strong>
      </div>
      <form className="createaccount-form" style={{width: '100%', maxWidth: 900, margin: '32px auto'}} onSubmit={handleSubmit} encType="multipart/form-data">
        {groups.map((group, idx) => {
          const groupFields = getFieldsForGroup(group.names);
          if (groupFields.length === 0) return null;
          return (
            <div className="createaccount-form-section" key={group.title}>
              <h3 className="createaccount-section-title">{group.title}</h3>
              <div className="createaccount-form-grid">
                {groupFields.map((field) => {
                  if (field.type === 'select') {
                    return (
                      <div className="createaccount-form-group" key={field.name}>
                        <label htmlFor={field.name}>{field.label}</label>
                        <select id={field.name} name={field.name} required={field.required}>
                          <option value="">Select</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (field.type === 'textarea') {
                    return (
                      <div className="createaccount-form-group" key={field.name} style={{ gridColumn: '1 / span 2' }}>
                        <label htmlFor={field.name}>{field.label}</label>
                        <textarea id={field.name} name={field.name} required={field.required} rows={3} />
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
                  return (
                    <div className="createaccount-form-group" key={field.name}>
                      <label htmlFor={field.name}>{field.label}</label>
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        required={field.required}
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
      <Footer />
    </>
  );
};

export default CreateAccount;
