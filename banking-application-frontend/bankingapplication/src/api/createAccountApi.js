import axios from 'axios';

// API to create a new bank account (JSON only)
export const createAccount = async (data) => {
  const response = await axios.post('http://localhost:8080/api/indiabankaccounts', data, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};
