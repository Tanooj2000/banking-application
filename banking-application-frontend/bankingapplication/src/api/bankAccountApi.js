// src/api/bankAccountApi.js

const BASE_URL = 'http://localhost:8082/api/accounts';

export const getUserBankAccounts = async (userId) => {
  const response = await fetch(`${BASE_URL}/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bank accounts');
  }
  return response.json();
};
