import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { createAccount, getUserBankAccounts } from '../api/accountApi';
import { validateGmail, validateFullName, validateMobile, getErrorMessage } from '../utils/validation';

import './CreateAccount.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Multi-step form configuration
const FORM_STEPS = [
  {
    id: 'personal',
    title: 'Personal Details',
    icon: '👤'
  },
  {
    id: 'educational',
    title: 'Educational Details',
    icon: '🎓'
  },
  {
    id: 'income',
    title: 'Income Details',
    icon: '💰'
  },
  {
    id: 'nominee',
    title: 'Nominee Details',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 'documents',
    title: 'Documents Upload',
    icon: '📄'
  }
];

const stepFields = {
  India: {
    personal: [
      { label: 'Full Name', name: 'fullName', type: 'text', required: true },
      { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
      { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
      { label: 'Mobile Number', name: 'mobile', type: 'text', required: true },
      { label: 'Email', name: 'email', type: 'email', required: true },
      { label: 'Address', name: 'address', type: 'textarea', required: true },
      { label: 'Aadhaar Number', name: 'aadhaar', type: 'text', required: true },
      { label: 'PAN Number', name: 'pan', type: 'text', required: true }
    ],
    educational: [
      { label: 'Education Level', name: 'educationLevel', type: 'select', required: true, options: ['High School', 'Diploma', 'Graduate', 'Post Graduate', 'Professional'] },
      { label: 'Institution Name', name: 'institutionName', type: 'text', required: true },
      { label: 'Course/Degree', name: 'course', type: 'text', required: true },
      { label: 'Year of Completion', name: 'yearOfCompletion', type: 'number', required: true },
      { label: 'Percentage/CGPA', name: 'grade', type: 'text', required: false }
    ],
    income: [
      { label: 'Employment Status', name: 'employmentStatus', type: 'select', required: true, options: ['Employed', 'Self-Employed', 'Business', 'Student', 'Retired', 'Unemployed'] },
      { label: 'Employer Name', name: 'employerName', type: 'text', required: false },
      { label: 'Occupation', name: 'occupation', type: 'text', required: true },
      { label: 'Monthly Income (INR)', name: 'monthlyIncome', type: 'number', required: true },
      { label: 'Annual Income (INR)', name: 'annualIncome', type: 'number', required: true },
      { label: 'Income Source', name: 'incomeSource', type: 'select', required: true, options: ['Salary', 'Business', 'Investment', 'Pension', 'Other'] }
    ],
    nominee: [
      { label: 'Nominee Full Name', name: 'nomineeName', type: 'text', required: true },
      { label: 'Relationship with Nominee', name: 'nomineeRelation', type: 'select', required: true, options: ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'] },
      { label: 'Nominee Date of Birth', name: 'nomineeDob', type: 'date', required: true },
      { label: 'Nominee Contact Number', name: 'nomineeContact', type: 'text', required: true },
      { label: 'Nominee Address', name: 'nomineeAddress', type: 'textarea', required: true }
    ],
    documents: [
      { label: 'ID Proof', name: 'idProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Address Proof', name: 'addressProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Income Proof', name: 'incomeProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Passport Photo', name: 'photo', type: 'file', required: true, accept: '.jpg,.jpeg,.png' },
      { label: 'Account Type', name: 'accountType', type: 'select', required: true, options: ['SAVINGS', 'CURRENT', 'SALARY', 'FIXED_DEPOSIT'] },
      { label: 'Initial Deposit (INR)', name: 'deposit', type: 'number', required: true },
      { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' }
    ]
  },
  USA: {
    personal: [
      { label: 'Full Name', name: 'fullName', type: 'text', required: true },
      { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
      { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
      { label: 'Phone Number', name: 'phone', type: 'text', required: true },
      { label: 'Email', name: 'email', type: 'email', required: true },
      { label: 'Address', name: 'address', type: 'textarea', required: true },
      { label: 'SSN', name: 'ssn', type: 'text', required: true }
    ],
    educational: [
      { label: 'Education Level', name: 'educationLevel', type: 'select', required: true, options: ['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'Doctoral Degree'] },
      { label: 'Institution Name', name: 'institutionName', type: 'text', required: true },
      { label: 'Major/Field of Study', name: 'course', type: 'text', required: true },
      { label: 'Year of Completion', name: 'yearOfCompletion', type: 'number', required: true },
      { label: 'GPA', name: 'grade', type: 'text', required: false }
    ],
    income: [
      { label: 'Employment Status', name: 'employmentStatus', type: 'select', required: true, options: ['Employed', 'Self-Employed', 'Business Owner', 'Student', 'Retired', 'Unemployed'] },
      { label: 'Employer Name', name: 'employerName', type: 'text', required: false },
      { label: 'Occupation', name: 'occupation', type: 'text', required: true },
      { label: 'Monthly Income (USD)', name: 'monthlyIncome', type: 'number', required: true },
      { label: 'Annual Income (USD)', name: 'annualIncome', type: 'number', required: true },
      { label: 'Income Source', name: 'incomeSource', type: 'select', required: true, options: ['Salary', 'Business', 'Investment', 'Social Security', 'Other'] }
    ],
    nominee: [
      { label: 'Nominee Full Name', name: 'nomineeName', type: 'text', required: true },
      { label: 'Relationship with Nominee', name: 'nomineeRelation', type: 'select', required: true, options: ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'] },
      { label: 'Nominee Date of Birth', name: 'nomineeDob', type: 'date', required: true },
      { label: 'Nominee Contact Number', name: 'nomineeContact', type: 'text', required: true },
      { label: 'Nominee Address', name: 'nomineeAddress', type: 'textarea', required: true }
    ],
    documents: [
      { label: 'ID Proof', name: 'idProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Address Proof', name: 'addressProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Income Proof', name: 'incomeProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Passport Photo', name: 'photo', type: 'file', required: true, accept: '.jpg,.jpeg,.png' },
      { label: 'Account Type', name: 'accountType', type: 'select', required: true, options: ['CHECKING', 'SAVINGS', 'MONEY_MARKET', 'CERTIFICATE_OF_DEPOSIT'] },
      { label: 'Initial Deposit (USD)', name: 'deposit', type: 'number', required: true },
      { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' }
    ]
  },
  UK: {
    personal: [
      { label: 'Full Name', name: 'fullName', type: 'text', required: true },
      { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
      { label: 'Gender', name: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
      { label: 'Phone Number', name: 'phone', type: 'text', required: true },
      { label: 'Email', name: 'email', type: 'email', required: true },
      { label: 'Address', name: 'address', type: 'textarea', required: true },
      { label: 'National Insurance Number', name: 'nin', type: 'text', required: true }
    ],
    educational: [
      { label: 'Education Level', name: 'educationLevel', type: 'select', required: true, options: ['GCSE', 'A-Levels', 'Undergraduate Degree', 'Postgraduate Degree', 'Professional Qualification'] },
      { label: 'Institution Name', name: 'institutionName', type: 'text', required: true },
      { label: 'Course/Subject', name: 'course', type: 'text', required: true },
      { label: 'Year of Completion', name: 'yearOfCompletion', type: 'number', required: true },
      { label: 'Grade/Classification', name: 'grade', type: 'text', required: false }
    ],
    income: [
      { label: 'Employment Status', name: 'employmentStatus', type: 'select', required: true, options: ['Employed', 'Self-Employed', 'Business Owner', 'Student', 'Retired', 'Unemployed'] },
      { label: 'Employer Name', name: 'employerName', type: 'text', required: false },
      { label: 'Occupation', name: 'occupation', type: 'text', required: true },
      { label: 'Monthly Income (GBP)', name: 'monthlyIncome', type: 'number', required: true },
      { label: 'Annual Income (GBP)', name: 'annualIncome', type: 'number', required: true },
      { label: 'Income Source', name: 'incomeSource', type: 'select', required: true, options: ['Salary', 'Business', 'Investment', 'Pension', 'Other'] }
    ],
    nominee: [
      { label: 'Nominee Full Name', name: 'nomineeName', type: 'text', required: true },
      { label: 'Relationship with Nominee', name: 'nomineeRelation', type: 'select', required: true, options: ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'] },
      { label: 'Nominee Date of Birth', name: 'nomineeDob', type: 'date', required: true },
      { label: 'Nominee Contact Number', name: 'nomineeContact', type: 'text', required: true },
      { label: 'Nominee Address', name: 'nomineeAddress', type: 'textarea', required: true }
    ],
    documents: [
      { label: 'ID Proof', name: 'idProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Address Proof', name: 'addressProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Income Proof', name: 'incomeProof', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf' },
      { label: 'Passport Photo', name: 'photo', type: 'file', required: true, accept: '.jpg,.jpeg,.png' },
      { label: 'Account Type', name: 'accountType', type: 'select', required: true, options: ['CURRENT', 'SAVINGS', 'ISA', 'FIXED_TERM'] },
      { label: 'Initial Deposit (GBP)', name: 'deposit', type: 'number', required: true },
      { label: 'Consent', name: 'consent', type: 'checkbox', required: true, labelAfter: true, labelText: 'I agree to the terms and conditions.' }
    ]
  }
};

const CreateAccount = () => {
  const query = useQuery();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  // Generate a unique key for this form session
  const formStorageKey = `createAccount_${bankName}_${branch}_${country}`;
  
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(`${formStorageKey}_step`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = localStorage.getItem(`${formStorageKey}_completedSteps`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(`${formStorageKey}_formData`);
    return saved ? JSON.parse(saved) : {};
  });
  const [formStatus, setFormStatus] = useState({ loading: false, success: null, error: null });
  const [existingAccountData, setExistingAccountData] = useState(null);
  const [isLoadingAccountData, setIsLoadingAccountData] = useState(false);

  const userId = location.state?.userId;
  const bankName = query.get('bank');
  const branch = query.get('branch');
  const country = query.get('country') || 'India';
  const code = query.get('code') || '';
  
  // Get current step configuration
  const currentStepId = FORM_STEPS[currentStep].id;
  const currentFields = stepFields[country]?.[currentStepId] || [];

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
        
        if (bankAccounts && bankAccounts.length > 0) {
          const firstAccount = bankAccounts[0];
          setExistingAccountData(firstAccount);
          
          // Pre-fill form data with existing account data, but preserve any saved form data
          setFormData(prevData => ({
            ...firstAccount,
            ...prevData // Saved form data takes precedence
          }));
        }
      } catch (error) {
        console.error('Failed to load bank account data:', error);
      } finally {
        setIsLoadingAccountData(false);
      }
    };

    fetchBankAccountData();
  }, [userId]);

  // Persist form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`${formStorageKey}_formData`, JSON.stringify(formData));
  }, [formData, formStorageKey]);

  // Persist current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`${formStorageKey}_step`, currentStep.toString());
  }, [currentStep, formStorageKey]);

  // Persist completed steps to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`${formStorageKey}_completedSteps`, JSON.stringify([...completedSteps]));
  }, [completedSteps, formStorageKey]);

  // Helper function to check if field should be disabled
  const isFieldDisabled = (fieldName) => {
    return existingAccountData && unchangeableFields.includes(fieldName);
  };

  // Handle input changes
  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Clear saved form data
  const clearSavedData = () => {
    localStorage.removeItem(`${formStorageKey}_formData`);
    localStorage.removeItem(`${formStorageKey}_step`);
    localStorage.removeItem(`${formStorageKey}_completedSteps`);
    setFormData({});
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setFormStatus({ loading: false, success: 'Saved form data cleared!', error: null });
  };

  // Validate current step
  const validateCurrentStep = () => {
    const requiredFields = currentFields.filter(field => field.required);
    const errors = [];

    for (const field of requiredFields) {
      const value = formData[field.name];
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${field.label} is required`);
        continue;
      }

      // Specific validations
      if (field.name === 'fullName' && value) {
        const nameValidation = validateFullName(value);
        if (!nameValidation.isValid) {
          errors.push(nameValidation.message);
        }
      }

      if (field.name === 'email' && value) {
        const emailValidation = validateGmail(value);
        if (!emailValidation.isValid) {
          errors.push(emailValidation.message);
        }
      }

      if ((field.name === 'mobile' || field.name === 'phone') && value) {
        const mobileValidation = validateMobile(value);
        if (!mobileValidation.isValid) {
          errors.push(mobileValidation.message);
        }
      }
    }

    return errors;
  };

  // Handle next step
  const handleNext = () => {
    const errors = validateCurrentStep();
    
    if (errors.length > 0) {
      setFormStatus({ loading: false, success: null, error: errors[0] });
      return;
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setFormStatus({ loading: false, success: null, error: null });
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setFormStatus({ loading: false, success: null, error: null });
    }
  };

  // Handle save (for non-final steps)
  const handleSave = () => {
    const errors = validateCurrentStep();
    
    if (errors.length > 0) {
      setFormStatus({ loading: false, success: null, error: errors[0] });
      return;
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    // Force save to localStorage immediately
    localStorage.setItem(`${formStorageKey}_formData`, JSON.stringify(formData));
    localStorage.setItem(`${formStorageKey}_step`, currentStep.toString());
    localStorage.setItem(`${formStorageKey}_completedSteps`, JSON.stringify([...completedSteps, currentStep]));
    
    setFormStatus({ loading: false, success: 'Progress saved successfully! Data will persist even after logout.', error: null });
  };

  // Handle final form submission
  const handleSubmit = async () => {
    const errors = validateCurrentStep();
    
    if (errors.length > 0) {
      setFormStatus({ loading: false, success: null, error: errors[0] });
      return;
    }

    setFormStatus({ loading: true, success: null, error: null });

    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        bank: bankName || '',
        branch: branch || '',
        ifscCode: code,
        status: 'PENDING',
        accountNumber: ''
      };

      if (userId) {
        submissionData.userId = userId;
      }

      await createAccount(submissionData, country);
      
      // Clear saved form data on successful submission
      localStorage.removeItem(`${formStorageKey}_formData`);
      localStorage.removeItem(`${formStorageKey}_step`);
      localStorage.removeItem(`${formStorageKey}_completedSteps`);
      
      setFormStatus({ loading: false, success: 'Account created successfully!', error: null });
      
      setTimeout(() => {
        navigate('/userpage');
      }, 2000);
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setFormStatus({ loading: false, success: null, error: errorMessage });
    }
  };

  // Progress indicator component
  const ProgressIndicator = () => (
    <div className="progress-train">
      {FORM_STEPS.map((step, index) => (
        <div key={step.id} className="progress-step-container">
          <div 
            className={`progress-step ${
              index === currentStep ? 'current' : 
              completedSteps.has(index) ? 'completed' : 'pending'
            }`}
            onClick={() => {
              if (completedSteps.has(index) || index <= currentStep) {
                setCurrentStep(index);
              }
            }}
          >
            <div className="step-icon">
              {completedSteps.has(index) ? '✓' : step.icon}
            </div>
            <div className="step-title">{step.title}</div>
          </div>
          {index < FORM_STEPS.length - 1 && (
            <div className={`progress-connector ${
              completedSteps.has(index) ? 'completed' : 'pending'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // Render field component
  const renderField = (field) => {
    const value = formData[field.name] || '';
    const isDisabled = isFieldDisabled(field.name);

    if (field.type === 'select') {
      return (
        <div className="createaccount-form-group" key={field.name}>
          <label htmlFor={field.name}>
            {field.label}
            {isDisabled && <span style={{ color: '#10b981', fontSize: '0.8em' }}> (Pre-filled)</span>}
            {field.required && <span className="required">*</span>}
          </label>
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            disabled={isDisabled}
            style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
          >
            <option value="">Select</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div className="createaccount-form-group" key={field.name} style={{ gridColumn: '1 / span 2' }}>
          <label htmlFor={field.name}>
            {field.label}
            {isDisabled && <span style={{ color: '#10b981', fontSize: '0.8em' }}> (Pre-filled)</span>}
            {field.required && <span className="required">*</span>}
          </label>
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            rows={3}
            disabled={isDisabled}
            style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
          />
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div className="createaccount-form-group" key={field.name} style={{ gridColumn: '1 / span 2', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={value === true}
            onChange={(e) => handleInputChange(field.name, e.target.checked)}
            required={field.required}
          />
          <label htmlFor={field.name} style={{ marginBottom: 0 }}>
            {field.labelText || field.label}
            {field.required && <span className="required">*</span>}
          </label>
        </div>
      );
    }

    if (field.type === 'file') {
      return (
        <div className="createaccount-form-group" key={field.name}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          <input
            type="file"
            id={field.name}
            name={field.name}
            onChange={(e) => handleInputChange(field.name, e.target.files[0])}
            required={field.required}
            accept={field.accept}
          />
          {value && <div className="file-selected">Selected: {value.name || 'File selected'}</div>}
        </div>
      );
    }

    // Default input field
    return (
      <div className="createaccount-form-group" key={field.name}>
        <label htmlFor={field.name}>
          {field.label}
          {isDisabled && <span style={{ color: '#10b981', fontSize: '0.8em' }}> (Pre-filled)</span>}
          {field.required && <span className="required">*</span>}
        </label>
        <input
          type={field.type}
          id={field.name}
          name={field.name}
          value={value}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          required={field.required}
          disabled={isDisabled}
          style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
        />
      </div>
    );
  };

  return (
    <>
      <Header />
      <h2 className="createaccount-title" style={{ marginTop: 40 }}>
        {existingAccountData ? 'Create Additional Bank Account' : 'Application For Account Creation'}
      </h2>
      
      <div className="createaccount-info-line">
        Bank: <strong>{bankName || 'N/A'}</strong> &nbsp; | &nbsp; Country: <strong>{country}</strong> &nbsp; | &nbsp; IFSC Code: <strong>{code}</strong>
        {existingAccountData && (
          <span style={{ marginLeft: '20px', color: '#10b981', fontWeight: '500' }}>
            ✓ Existing account holder - Personal details were pre-filled 
          </span>
        )}
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {isLoadingAccountData ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <div>Loading your account information...</div>
        </div>
      ) : (
        <div className="createaccount-form" style={{ width: '100%', maxWidth: 900, margin: '32px auto' }}>
          {/* Current Step Form */}
          <div className="createaccount-form-section">
            <h3 className="createaccount-section-title">{FORM_STEPS[currentStep].title}</h3>
            <div className="createaccount-form-grid">
              {currentFields.map(renderField)}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 0 && (
              <button 
                type="button" 
                className="nav-btn prev-btn" 
                onClick={handlePrevious}
              >
                ← Previous
              </button>
            )}
            
            <button 
              type="button" 
              className="nav-btn save-btn" 
              onClick={handleSave}
            >
              💾 Save Progress
            </button>

            {/* Show clear button if there's saved data */}
            {(Object.keys(formData).length > 0 || currentStep > 0 || completedSteps.size > 0) && (
              <button 
                type="button" 
                className="nav-btn clear-btn" 
                onClick={clearSavedData}
                title="Clear all saved form data and start fresh"
              >
                🗑️ Clear Saved
              </button>
            )}

            {currentStep < FORM_STEPS.length - 1 ? (
              <button 
                type="button" 
                className="nav-btn next-btn" 
                onClick={handleNext}
              >
                Next →
              </button>
            ) : (
              <button 
                type="button" 
                className="createaccount-submit-btn" 
                onClick={handleSubmit}
                disabled={formStatus.loading}
              >
                {formStatus.loading ? 'Creating...' : 'Submit Application'}
              </button>
            )}
          </div>

          {/* Status Messages */}
          {formStatus.success && <div className="createaccount-success-msg">{formStatus.success}</div>}
          {formStatus.error && <div className="createaccount-error-msg">{formStatus.error}</div>}
        </div>
      )}
      
      <Footer />
    </>
  );
};

export default CreateAccount;
