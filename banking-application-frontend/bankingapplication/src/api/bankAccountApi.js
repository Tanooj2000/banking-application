// src/api/bankAccountApi.js
import axios from 'axios';
const BASE_URL = 'http://localhost:8085/api/accounts';

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

