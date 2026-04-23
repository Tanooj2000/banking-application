import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { createAccount, getUserBankAccounts } from '../api/accountApi';
import { validateGmail, validateFullName, validateMobile, getErrorMessage, validatePAN, validateAadhaar, formatBackendErrorMessage } from '../utils/validation';

import './CreateAccount.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Multi-step form configuration
const FORM_STEPS = [
  {
    id: 'branch',
    title: 'Select Branch',
    icon: '🏦'
  },
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
  
  // Extract navigation state from UserPage bank selection
  const userId = location.state?.userId;
  const selectedCountry = location.state?.selectedCountry || 'India';
  const selectedBank = location.state?.selectedBank;
  const selectedBranch = location.state?.selectedBranch;
  const branches = location.state?.branches || [];
  
  // Fallback to URL parameters for backward compatibility
  const bankName = selectedBank?.name || query.get('bank');
  const branchName = selectedBranch?.branch || query.get('branch');
  const country = selectedCountry || query.get('country') || 'India';
  const code = query.get('code') || '';
  
  // State management
  const [selectedBranchInfo, setSelectedBranchInfo] = useState(() => {
    // Use the selectedBranch from navigation state first
    if (selectedBranch) {
      return selectedBranch;
    }
    // Fallback to finding in branches array
    if (branchName && branches.length > 0) {
      return branches.find(b => b.branch === branchName) || null;
    }
    return null;
  });
  
  // Generate a unique key for this form session
  const formStorageKey = `createAccount_${bankName}_${selectedBranchInfo?.branch || 'temp'}_${country}`;
  
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(`${formStorageKey}_step`);
    // Start with branch selection (step 0) if no branch is selected
    const initialStep = selectedBranchInfo ? 1 : 0;
    return saved ? parseInt(saved, 10) : initialStep;
  });
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = localStorage.getItem(`${formStorageKey}_completedSteps`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(`${formStorageKey}_formData`);
    const baseData = saved ? JSON.parse(saved) : {};
    // Include branch info if selected
    if (selectedBranchInfo) {
      baseData.selectedBranch = selectedBranchInfo;
    }
    return baseData;
  });
  const [formStatus, setFormStatus] = useState({ loading: false, success: null, error: null });
  const [fieldErrors, setFieldErrors] = useState({});
  const [existingAccountData, setExistingAccountData] = useState(null);
  const [isLoadingAccountData, setIsLoadingAccountData] = useState(false);
  
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
    
    // Clear field error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Clear saved form data
  const clearSavedData = () => {
    localStorage.removeItem(`${formStorageKey}_formData`);
    localStorage.removeItem(`${formStorageKey}_step`);
    localStorage.removeItem(`${formStorageKey}_completedSteps`);
    setFormData({});
    setFieldErrors({});
    setCompletedSteps(new Set());
    setFormStatus({ loading: false, success: null, error: null });
  };

  // Validate current step and return field-specific errors
  const validateCurrentStep = () => {
    const newFieldErrors = {};
    
    // Special validation for branch selection step
    if (currentStepId === 'branch') {
      if (!selectedBranchInfo) {
        setFieldErrors({ branch: 'Please select a branch to continue' });
        return false;
      }
      setFieldErrors({});
      return true;
    }
    
    const requiredFields = currentFields.filter(field => field.required);

    for (const field of requiredFields) {
      const value = formData[field.name];
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newFieldErrors[field.name] = `${field.label} is required`;
        continue;
      }

      // Specific validations
      if (field.name === 'fullName' && value) {
        const nameValidation = validateFullName(value);
        if (!nameValidation.isValid) {
          newFieldErrors[field.name] = nameValidation.message;
        }
      }

      if (field.name === 'email' && value) {
        const emailValidation = validateGmail(value);
        if (!emailValidation.isValid) {
          newFieldErrors[field.name] = emailValidation.message;
        }
      }

      if ((field.name === 'mobile' || field.name === 'phone') && value) {
        const mobileValidation = validateMobile(value);
        if (!mobileValidation.isValid) {
          newFieldErrors[field.name] = mobileValidation.message;
        }
      }

      if (field.name === 'panCard' && value) {
        const panValidation = validatePAN(value);
        if (!panValidation.isValid) {
          newFieldErrors[field.name] = panValidation.message;
        }
      }

      if (field.name === 'aadhaarNumber' && value) {
        const aadhaarValidation = validateAadhaar(value);
        if (!aadhaarValidation.isValid) {
          newFieldErrors[field.name] = aadhaarValidation.message;
        }
      }
    }

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    const isValid = validateCurrentStep();
    
    if (!isValid) {
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
    const isValid = validateCurrentStep();
    
    if (!isValid) {
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
    const isValid = validateCurrentStep();
    
    if (!isValid) {
      return;
    }

    setFormStatus({ loading: true, success: null, error: null });

    try {
      // Prepare complete submission data matching backend DTO structure
      const submissionData = {
        // Include all form data (all step fields filled by user)
        ...formData,
        
        // System fields (required by backend DTO)
        userId: userId || '',
        bank: bankName || '',
        branch: selectedBranchInfo?.branch || '',
        ifscCode: selectedBranchInfo?.code || code || '',
        status: 'PENDING',
        accountNumber: '', // Empty as per backend logic
        country: country,
        
        // Remove selectedBranch object as it's not needed in DTO
        // (keeping the extracted branch info in individual fields above)
      };
      
      // Remove selectedBranch from submission data as backend doesn't need it
      delete submissionData.selectedBranch;

      // Log the complete data being sent (for debugging)
      console.log('=== ACCOUNT CREATION SUBMISSION ===');
      console.log('Complete submission data being sent to backend:', submissionData);
      console.log('Total fields in submission:', Object.keys(submissionData).length);
      
      // Log each section for debugging  
      console.log('System Fields:', {
        userId: submissionData.userId,
        bank: submissionData.bank,
        branch: submissionData.branch,
        ifscCode: submissionData.ifscCode,
        status: submissionData.status,
        accountNumber: submissionData.accountNumber,
        country: submissionData.country
      });
      
      // Log file fields separately (these become @RequestParam in backend)
      const fileFields = ['idProof', 'addressProof', 'incomeProof', 'photo'];
      const files = {};
      fileFields.forEach(field => {
        if (submissionData[field]) {
          files[field] = submissionData[field].name || 'File selected';
        }
      });
      console.log('File Fields (sent as @RequestParam):', files);
      
      // Log all other form data (these become @ModelAttribute DTO fields)
      const otherFields = Object.keys(submissionData).filter(key => 
        !['userId', 'bank', 'branch', 'ifscCode', 'status', 'accountNumber', 'country', ...fileFields].includes(key)
      );
      const otherData = {};
      otherFields.forEach(field => {
        otherData[field] = submissionData[field];
      });
      console.log('DTO Form Fields (sent as @ModelAttribute):', otherData);
      console.log(`Endpoint: /api/accounts/create/${country.toLowerCase()}`);
      console.log('=====================================');
      
      await createAccount(submissionData, country);
      
      // Clear saved form data on successful submission
      localStorage.removeItem(`${formStorageKey}_formData`);
      localStorage.removeItem(`${formStorageKey}_step`);
      localStorage.removeItem(`${formStorageKey}_completedSteps`);
      
      setFormStatus({ loading: false, success: 'Account application submitted successfully! Your application is now pending admin verification. You will receive your account number once approved.', error: null });
      
      // Navigate after showing success message for 5 seconds (longer to read the message)
      setTimeout(() => {
        navigate('/userpage');
      }, 5000);
    } catch (err) {
      let errorMessage = err.message || 'An unexpected error occurred during account creation';
      
      // Format backend error messages for better user experience
      errorMessage = formatBackendErrorMessage(errorMessage);
      
      console.error('Account creation error:', err);
      console.error('Formatted error message:', errorMessage);
      setFormStatus({ loading: false, success: null, error: errorMessage });
      
      // Navigate after showing error message for 5 seconds
      //setTimeout(() => {
       // navigate('/userpage');
      //}, 5000);
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
    const hasError = fieldErrors[field.name];

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
            className={hasError ? 'field-error' : ''}
            style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
          >
            <option value="">Select</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {hasError && (
            <div className="field-error-message">
              {fieldErrors[field.name]}
            </div>
          )}
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
            className={hasError ? 'field-error' : ''}
            style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
          />
          {hasError && (
            <div className="field-error-message">
              {fieldErrors[field.name]}
            </div>
          )}
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
            className={hasError ? 'field-error' : ''}
          />
          <label htmlFor={field.name} style={{ marginBottom: 0 }}>
            {field.labelText || field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {hasError && (
            <div className="field-error-message" style={{ gridColumn: '1 / span 2', marginTop: '4px' }}>
              {fieldErrors[field.name]}
            </div>
          )}
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
            className={hasError ? 'field-error' : ''}
          />
          {value && <div className="file-selected">Selected: {value.name || 'File selected'}</div>}
          {hasError && (
            <div className="field-error-message">
              {fieldErrors[field.name]}
            </div>
          )}
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
          className={hasError ? 'field-error' : ''}
          style={isDisabled ? { backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
        />
        {hasError && (
          <div className="field-error-message">
            {fieldErrors[field.name]}
          </div>
        )}
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
        Bank: <strong>{bankName || 'N/A'}</strong> &nbsp; | &nbsp; 
        Branch: <strong>{selectedBranchInfo?.branch || 'Not Selected'}</strong> &nbsp; | &nbsp; 
        Country: <strong>{country}</strong>
        {selectedBranchInfo && (
          <span style={{ marginLeft: '20px', color: '#C9A84C', fontWeight: '500' }}>
            📍 {selectedBranchInfo.city} - {selectedBranchInfo.code}
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
            
            {/* Branch Selection Step */}
            {currentStepId === 'branch' ? (
              <div className="branch-selection-container">
                <div className="branch-selection-header">
                  <h4>Select Your Branch</h4>
                  <p>Choose your preferred branch location for <strong>{bankName}</strong></p>
                </div>
                
                <div className="simple-branch-selection">
                  <div className="createaccount-form-group">
                    <label htmlFor="branch-select">Available Branches *</label>
                    <select
                      id="branch-select"
                      value={selectedBranchInfo?.branch || ''}
                      onChange={(e) => {
                        const selected = branches.find(b => b.branch === e.target.value);
                        setSelectedBranchInfo(selected || null);
                        setFormData(prev => ({ ...prev, selectedBranch: selected }));
                        // Clear branch error when selection is made
                        if (fieldErrors.branch && selected) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.branch;
                            return newErrors;
                          });
                        }
                      }}
                      className={`branch-select-dropdown ${fieldErrors.branch ? 'field-error' : ''}`}
                      required
                    >
                      <option value="">-- Select a Branch --</option>
                      {branches.map((branch, index) => (
                        <option key={index} value={branch.branch}>
                          {branch.branch} - {branch.city} ({branch.code})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.branch && (
                      <div className="field-error-message">
                        {fieldErrors.branch}
                      </div>
                    )}
                  </div>
                  
                  {selectedBranchInfo && (
                    <div className="selected-branch-info">
                      <div className="branch-info-card">
                        <h5>Selected Branch Details</h5>
                        <div className="branch-details-compact">
                          <div><strong>Branch:</strong> {selectedBranchInfo.branch}</div>
                          <div><strong>City:</strong> {selectedBranchInfo.city}</div>
                          <div><strong>Code:</strong> {selectedBranchInfo.code}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {branches.length === 0 && (
                  <div className="no-branches-message">
                    <div className="empty-icon">🏦</div>
                    <h4>No Branches Available</h4>
                    <p>There are currently no branches available for {bankName} in {country}.</p>
                    <button 
                      className="nav-btn back-btn" 
                      onClick={() => navigate('/userpage')}
                    >
                      ← Back to Bank Selection
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Regular Form Fields for Other Steps */
              <div className="createaccount-form-grid">
                {currentFields.map(renderField)}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="form-navigation">
            <div className="form-navigation-left">
              {currentStep > 0 && (
                <button 
                  type="button" 
                  className="nav-btn prev-btn" 
                  onClick={handlePrevious}
                >
                  ← Previous
                </button>
              )}
              
              {/* Go back to bank selection from branch step */}
              {currentStep === 0 && (
                <button 
                  type="button" 
                  className="nav-btn back-btn" 
                  onClick={() => navigate('/userpage')}
                >
                  ← Back to Bank Selection
                </button>
              )}
            </div>
            
            <div className="form-navigation-right">
              {currentStep > 0 && (
                <button 
                  type="button" 
                  className="nav-btn save-btn" 
                  onClick={handleSave}
                >
                  Save
                </button>
              )}

              {/* Show clear button if there's saved data */}
              {(Object.keys(formData).length > 0 || currentStep > 0 || completedSteps.size > 0) && currentStep > 0 && (
                <button 
                  type="button" 
                  className="nav-btn clear-btn" 
                  onClick={clearSavedData}
                  title="Clear all saved form data and start fresh"
                >
                  Clear
                </button>
              )}

              {currentStep < FORM_STEPS.length - 1 ? (
                <button 
                  type="button" 
                  className="nav-btn next-btn" 
                  onClick={handleNext}
                >
                  {currentStep === 0 ? 'Continue with Selected Branch' : 'Next'} →
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
