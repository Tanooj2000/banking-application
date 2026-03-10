// src/api/bankApi.js

const BASE_URL = 'http://localhost:8082/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle auth errors
const handleAuthError = async (response) => {
  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid - clear stored data and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    window.dispatchEvent(new Event('storage'));
    
    // Optional: redirect to login if not already there
    if (!window.location.pathname.includes('/signin')) {
      window.location.href = '/signin';
    }
  }
};

// Fixed countries - no need for API call
export const getAvailableCountries = () => {
  return ['India', 'USA', 'UK'];
};

// Remove the fetchCountries function since we have fixed countries
// export const fetchCountries = async () => { ... } - REMOVED

export const fetchBanks = async (country) => {
  try {
    // Use only country path parameter
    const url = `${BASE_URL}/banks/country/${encodeURIComponent(country)}`;
    
    console.log('Fetching banks from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleAuthError(response);
      throw new Error(`Failed to fetch banks (Status: ${response.status})`);
    }

    const banks = await response.json();
    console.log('Fetch banks response:', banks);
    
    // Your backend returns array directly, not wrapped in success object
    return Array.isArray(banks) ? banks : [];
  } catch (error) {
    console.error('Error fetching banks:', error);
    
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check if the backend server is running on http://localhost:8081');
    }
    
    throw error;
  }
};

export const fetchBankById = async (bankId) => {
  try {
    const response = await fetch(`${BASE_URL}/banks/${bankId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      await handleAuthError(response);
      throw new Error(`Failed to fetch bank details (Status: ${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching bank:', error);
    throw error;
  }
};

// Bank-related API functions

export const createBranch = async (branchData) => {
  const response = await fetch(`${BASE_URL}/banks/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(branchData),
  });

  if (!response.ok) {
    await handleAuthError(response);
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create branch');
  }

  return await response.json();
};