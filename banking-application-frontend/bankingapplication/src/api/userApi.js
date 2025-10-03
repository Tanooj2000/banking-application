// src/api/userApi.js
import { getErrorMessage } from '../utils/validation';

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
    const cleanErrorMessage = getErrorMessage(errorMsg);
    throw new Error(cleanErrorMessage || 'Failed to sign up user');
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

export const getUserById = async (userId) => {
  try {

    
    const response = await fetch(`${BASE_URL}${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    

    
    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Get user error response:', errorMsg);
      const cleanErrorMessage = getErrorMessage(errorMsg);
      throw new Error(cleanErrorMessage || `Failed to fetch user details (Status: ${response.status})`);
    }
    
    const responseData = await response.json();

    
    // Extract the user object from the response
    if (responseData.success && responseData.user) {
      return responseData.user;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Get user details error:', error.message);
    
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check if the backend server is running on http://localhost:8081');
    }
    
    throw error;
  }
};

export const updateUserDetails = async (userId, userData) => {
  try {

    
    const response = await fetch(`${BASE_URL}${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    

    
    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Update user error response:', errorMsg);
      const cleanErrorMessage = getErrorMessage(errorMsg);
      throw new Error(cleanErrorMessage || 'Failed to update user details');
    }
    
    const responseData = await response.json();

    
    // Return the updated user data if it exists in the response
    if (responseData.success && responseData.user) {
      return responseData.user;
    } else {
      return responseData; // Fallback for different response formats
    }
  } catch (error) {
    console.error('Update user details error:', error.message);
    throw error;
  }
};

export const changeUserPassword = async (userId, passwordData) => {
  try {

    
    const response = await fetch(`${BASE_URL}${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
    

    
    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Change password error response:', errorMsg);
      const cleanErrorMessage = getErrorMessage(errorMsg);
      throw new Error(cleanErrorMessage || 'Failed to change password');
    }
    
    const result = await response.text();

    return result;
  } catch (error) {
    console.error('Change password error:', error.message);
    throw error;
  }
};


