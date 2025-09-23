// src/api/userApi.js

const BASE_URL = 'http://localhost:';

export const signUpUser = async (userData) => {
<<<<<<< HEAD
  const response = await fetch(`${BASE_URL}users`, {
=======
  const response = await fetch(`${BASE_URL}8081/api/user/register`, {
>>>>>>> 7c7dd756d0e10c0ef8d6c667acf05fe4483512c2
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

export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}8083/api/admin/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData),
  });
  if (!response.ok) {
    throw new Error('Failed to sign up admin');
  }
  return response.text();
};
