// src/api/userApi.js

const BASE_URL = 'http://localhost:8081/api/user';

export const signUpUser = async (userData) => {

  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to sign up user');
  }
  return response.text();
};

export const signInUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  // Always return the JSON, even for error cases, so frontend can handle message
  const data = await response.json();
  return data;
};


