// src/api/bankApi.js

const BASE_URL = 'http://localhost:8081/api';

// Fixed countries - no need for API call
export const getAvailableCountries = () => {
  return ['India', 'USA', 'UK'];
};

// Remove the fetchCountries function since we have fixed countries
// export const fetchCountries = async () => { ... } - REMOVED

export const fetchBanks = async (country) => {
  try {
    const url = `${BASE_URL}/banks/country/${encodeURIComponent(country)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch banks (Status: ${response.status}) - ${errorText}`);
    }

    const banks = await response.json();
    return Array.isArray(banks) ? banks : [];
  } catch (error) {
    console.error('Error fetching banks:', error);
    
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check if the backend server is running and CORS is configured for your frontend port');
    }
    
    throw error;
  }
};

export const fetchBankById = async (bankId) => {
  try {
    const response = await fetch(`${BASE_URL}/banks/${bankId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bank details (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Fetch bank by ID response:', data);
    
    if (data.success) {
      return data.bank;
    } else {
      throw new Error(data.message || 'Failed to fetch bank details');
    }
  } catch (error) {
    console.error('Error fetching bank by ID:', error);
    throw error;
  }
};

// Bank-related API functions

export const createBranch = async (branchData) => {
  const response = await fetch(`${BASE_URL}/banks/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(branchData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create branch');
  }

  return await response.json();
};