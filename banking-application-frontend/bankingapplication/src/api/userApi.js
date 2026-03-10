// src/api/userApi.js
import { getErrorMessage } from '../utils/validation';

const BASE_URL = 'http://localhost:8081/api/user/';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle auth errors
const handleAuthError = async (response) => {
  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid - clear stored data and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    window.dispatchEvent(new Event('storage'));
    
    // Optional: redirect to login if not already there
    if (!window.location.pathname.includes('/signin')) {
      window.location.href = '/signin';
    }
  }
};

export const signUpUser = async (userData) => {
  const response = await fetch(`${BASE_URL}register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    await handleAuthError(response);
    const errorMsg = await response.text();
    const cleanErrorMessage = getErrorMessage(errorMsg);
    throw new Error(cleanErrorMessage || 'Failed to sign up user');
  }
  return response.text();
};

export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to sign in');
  }
  
  const data = await response.json();
  
  // Store JWT token and user data if login successful
  if (data.success && data.token && data.user) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('userType', 'user');
  }
  
  return data;
};

// Logout function that calls backend to blacklist token
export const logoutUser = async () => {
  try {
    const response = await fetch(`${BASE_URL}logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    // Clear local storage regardless of response status
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    
    if (!response.ok) {
      console.warn('Logout request failed, but local storage cleared');
    }
    
    return { success: true };
  } catch (error) {
    // Clear local storage even if request fails
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    console.error('Logout error:', error);
    return { success: true }; // Still return success since we cleared local data
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      await handleAuthError(response);
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
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      await handleAuthError(response);
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
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
    
    if (!response.ok) {
      await handleAuthError(response);
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


