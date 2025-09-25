// src/api/userApi.js

const BASE_URL = 'http://localhost:8081/api/user/';

export const signUpUser = async (userData) => {
  const response = await fetch(`${BASE_URL}register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    // Always read error as text, since backend sends plain string
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to sign up user');
  }
  return response.text();
};

export const signInUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}login`, {
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

export const updateUserDetails = async (userId, userData) => {
  try {
    console.log('Updating user details for ID:', userId);
    console.log('Update data:', userData);
    
    const response = await fetch(`${BASE_URL}update/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    console.log('Update user response status:', response.status);
    
    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Update user error response:', errorMsg);
      throw new Error(errorMsg || 'Failed to update user details');
    }
    
    const result = await response.json();
    console.log('Update user success response:', result);
    return result;
  } catch (error) {
    console.error('Update user details error:', error.message);
    throw error;
  }
};

export const changeUserPassword = async (userId, passwordData) => {
  try {
    console.log('Changing password for user ID:', userId);
    
    const response = await fetch(`${BASE_URL}change-password/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
    
    console.log('Change password response status:', response.status);
    
    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Change password error response:', errorMsg);
      throw new Error(errorMsg || 'Failed to change password');
    }
    
    const result = await response.text();
    console.log('Change password success response:', result);
    return result;
  } catch (error) {
    console.error('Change password error:', error.message);
    throw error;
  }
};


