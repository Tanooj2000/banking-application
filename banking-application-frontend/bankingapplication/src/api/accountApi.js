// src/api/accountApi.js

const BASE_URL = 'http://localhost:8085/api/account/';

export const fetchAllAccounts = async () => {
  const response = await fetch(`${BASE_URL}all`);
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
};

export const approveAccount = async (accountId) => {
  const response = await fetch(`${BASE_URL}approve/${accountId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to approve account');
  }
  return response.json();
};

export const rejectAccount = async (accountId) => {
  const response = await fetch(`${BASE_URL}reject/${accountId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reject account');
  }
  return response.json();
};
