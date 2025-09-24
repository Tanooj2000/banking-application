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
  const response = await axios.post('http://localhost:8080/api/indiabankaccounts', data, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

