// src/api/accountApi.js
import axios from 'axios';
const BASE_URL = 'http://localhost:8085/api/accounts/';

export const getUserBankAccounts = async (userId) => {
  const response = await fetch(`${BASE_URL}/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bank accounts');
  }
  return response.json();
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
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('Account creation successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    throw error;
  }
};



export const fetchAllAccounts = async (bank) => {
  try {
    const response = await fetch(`${BASE_URL}bank/${bank}`);
    if (!response.ok) {
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
    console.error('Error in fetchAllAccounts:', err);
    throw err;
  }
};

export const approveAccount = async (accountId) => {
  try {
    const response = await fetch(`${BASE_URL}approve/${accountId}`, {
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

export const rejectAccount = async (accountId) => {
  try {
    const response = await fetch(`${BASE_URL}reject/${accountId}`, {
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
