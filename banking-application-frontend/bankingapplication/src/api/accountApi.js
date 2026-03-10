// src/api/accountApi.js
import axios from 'axios';
const BASE_URL = 'http://localhost:8085/api/accounts';

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
const handleAuthError = async (error) => {
  if (error.response?.status === 401 || error.response?.status === 403) {
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

export const getUserBankAccounts = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await handleAuthError({ response });
      }
      throw new Error('Failed to fetch bank accounts');
    }
    
    return response.json();
  } catch (error) {
    await handleAuthError(error);
    throw error;
  }
};
export const createAccount = async (data, country = 'India') => {
  // Map country name to country code
  console.log("Creating account with data:", data);
  console.log("Country:", country);
  let countryCode = 'IN';
  if (country) {
    const countryMap = {
      'India': 'IN',
      'USA': 'USA',
      'UK': 'UK',
    };
    countryCode = countryMap[country.trim()] || 'IN';
  }

  try {
    console.log('Using country code:', countryCode);
    console.log('API URL:', `${BASE_URL}/create/${countryCode}`);
    
    const response = await axios.post(
      `${BASE_URL}/create/${countryCode}`,
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('Account creation successful:', response.data);
    return response.data;
  } catch (error) {
    await handleAuthError(error);
    
    const errorText = error.response?.data || error.message;
    console.error('Error creating account Please Try Again :', errorText);
    throw new Error(errorText);
  }
};



export const fetchAllAccounts = async (bank) => {
  try {
    console.log(bank);
    const response = await fetch(`${BASE_URL}/bank/${bank}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      await handleAuthError({ response });
      const errorText = await response.text();
      console.error('Failed to fetch accounts:', errorText);
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
    await handleAuthError(err);
    console.error('Error in fetchAllAccounts:', err);
    throw err;
  }
};

export const approveAccount = async (accountId) => {
  try {
    const response = await fetch(`${BASE_URL}/approve/${accountId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleAuthError({ response });
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
    await handleAuthError(err);
    console.error('Error in approveAccount:', err);
    throw err;
  }
};

export const rejectAccount = async (accountId) => {
  try {
    const response = await fetch(`${BASE_URL}/reject/${accountId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleAuthError({ response });
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
    await handleAuthError(err);
    console.error('Error in rejectAccount:', err);
    throw err;
  }
};
