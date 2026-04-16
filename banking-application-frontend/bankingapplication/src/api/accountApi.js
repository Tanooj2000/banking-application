// src/api/accountApi.js
import axios from 'axios';
const BASE_URL = 'http://localhost:8085/api/accounts';

export const getUserBankAccounts = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch bank accounts (Status: ${response.status})`);
    }
    
    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text) {
      return []; // Return empty array if no content
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error in getUserBankAccounts:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check if the backend server is running on http://localhost:8085');
    }
    throw error;
  }
};
export const createAccount = async (data, country = 'India') => {
  // Map country name to backend endpoint paths
  console.log("Creating account with data:", data);
  console.log("Country:", country);
  
  let countryEndpoint = 'india'; // default
  if (country) {
    const countryMap = {
      'India': 'india',
      'USA': 'usa', 
      'UK': 'uk',
    };
    countryEndpoint = countryMap[country.trim()] || 'india';
  }

  try {
    console.log('Using country endpoint:', countryEndpoint);
    console.log('API URL:', `${BASE_URL}/create/${countryEndpoint}`);
    
    // Always use FormData for multipart/form-data as backend expects
    const formData = new FormData();
    
    // First, validate that all required files are present
    const fileFields = ['idProof', 'addressProof', 'incomeProof', 'photo'];
    const missingFiles = [];
    
    fileFields.forEach(fieldName => {
      if (!data[fieldName] || !(data[fieldName] instanceof File)) {
        missingFiles.push(fieldName);
      }
    });
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }
    
    // Add files as separate parameters (as backend @RequestParam expects)
    const files = {};
    fileFields.forEach(fieldName => {
      if (data[fieldName] && data[fieldName] instanceof File) {
        formData.append(fieldName, data[fieldName]);
        files[fieldName] = data[fieldName].name;
        console.log(`Added file parameter: ${fieldName} = ${data[fieldName].name}`);
      }
    });
    
    // Add all other form fields (for @ModelAttribute DTO)
    Object.keys(data).forEach(key => {
      if (!fileFields.includes(key) && data[key] !== null && data[key] !== undefined && key !== 'selectedBranch') {
        // Convert values to strings for FormData
        const value = typeof data[key] === 'boolean' ? data[key].toString() : data[key];
        formData.append(key, value);
        console.log(`Added form field: ${key} = ${value}`);
      }
    });
    
    console.log('Files being sent:', files);
    console.log('Sending multipart/form-data to backend');
    
    // Log FormData contents for debugging
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]));
    }
    
    const response = await axios.post(
      `${BASE_URL}/create/${countryEndpoint}`,
      formData
      // Don't set Content-Type header - let browser set multipart/form-data with boundary
    );
    
    console.log('Account creation successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('=== ACCOUNT CREATION ERROR ===');
    console.error('Error object:', error);
    
    if (error.response) {
      // Server responded with error status
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
      
      let errorMessage = 'Account creation failed: ';
      
      if (error.response.status === 400) {
        // Bad Request - usually validation errors
        if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        } else if (error.response.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.response.data?.validationResults) {
          // Handle validation errors
          const validationErrors = Object.values(error.response.data.validationResults).flat();
          errorMessage += `Validation errors: ${validationErrors.join(', ')}`;
        } else {
          errorMessage += 'Invalid request data';
        }
      } else if (error.response.status === 500) {
        errorMessage += 'Server error occurred';
      } else {
        errorMessage += `Server error (${error.response.status})`;
      }
      
      throw new Error(errorMessage);
    } else if (error.request) {
      // Network error
      console.error('Request made but no response:', error.request);
      throw new Error('Cannot connect to server. Please check if the backend server is running.');
    } else {
      // Request setup error
      console.error('Error setting up request:', error.message);
      throw new Error(error.message);
    }
  }
};



export const fetchAllAccounts = async (bank) => {
  try {
    console.log(bank);
    const response = await fetch(`${BASE_URL}/bank/${bank}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch accounts:', errorText);

      // Check for specific error message

      throw new Error('Failed to fetch accounts');
    }

    // Handle 204 No Content or empty response body
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.warn('No accounts found for the given bank.');
      return []; // Return an empty array if no content
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error in fetchAllAccounts:', err);
    throw err;
  }
};

export const approveAccount = async (accountId) => {
  try {
    const response = await fetch(`${BASE_URL}/approve/${accountId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to approve account:', errorText);
      throw new Error('Failed to approve account');
    }
    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();

      return { success: true, message: text };
    }
  } catch (err) {
    console.error('Error in approveAccount:', err);
    throw err;
  }
};

// Document related functions
export const viewDocument = async (documentId) => {
  const response = await fetch(`${BASE_URL}/documents/${documentId}/view`);
  if (!response.ok) {
    throw new Error(`Failed to view document (Status: ${response.status})`);
  }
  return response;
};

export const downloadDocument = async (documentId) => {
  const response = await fetch(`${BASE_URL}/documents/${documentId}/download`);
  if (!response.ok) {
    throw new Error(`Failed to download document (Status: ${response.status})`);
  }
  return response;
};

export const getUserDocuments = async (userId) => {
  const response = await fetch(`${BASE_URL}/user/${userId}/documents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user documents (Status: ${response.status})`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : [];
};

export const getAccountDocuments = async (accountNumber) => {
  const response = await fetch(`${BASE_URL}/account/${accountNumber}/documents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch account documents (Status: ${response.status})`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : [];
};

export const rejectAccount = async (accountId) => {
  try {
    const response = await fetch(`${BASE_URL}/reject/${accountId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to reject account:', errorText);
      throw new Error('Failed to reject account');
    }
    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();

      return { success: true, message: text };
    }
  } catch (err) {
    console.error('Error in rejectAccount:', err);
    throw err;
  }
};
