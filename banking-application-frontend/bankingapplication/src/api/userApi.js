// src/api/userApi.js

const BASE_URL = 'http://localhost:8080/api/';

export const signUpUser = async (userData) => {
  const response = await fetch(`${BASE_URL}users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to sign up user');
  }
  return response.json();
};

export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData),
  });
  if (!response.ok) {
    throw new Error('Failed to sign up admin');
  }
  return response.json();
};
