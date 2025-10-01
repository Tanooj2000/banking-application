// src/api/accountApi.js

const BASE_URL = 'http://localhost:8085/api/accounts/';

export const fetchAllAccounts = async (bank) => {
  try {
    const response = await fetch(`${BASE_URL}bank/${bank}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch accounts:', errorText);
      throw new Error('Failed to fetch accounts');
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
