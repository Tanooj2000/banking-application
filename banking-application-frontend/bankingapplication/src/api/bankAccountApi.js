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
export const createAccount = async (data) => {
  // Map country name to country code
  let countryCode = 'IN';
  if (data.country) {
    const countryMap = {
      'India': 'IN',
      'USA': 'USA',
      'UK': 'UK',
    };
    countryCode = countryMap[data.country.trim()] || 'IN';
  }

  const response = await axios.post(
    `${BASE_URL}/create/${countryCode}`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

