// src/api/userApi.js
import { getErrorMessage } from '../utils/validation';

const BASE_URL = 'http://localhost:8081/api/user/';

// Returns headers including Authorization Bearer token if one is stored
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// Redirect to sign-in on 401/403
const handleAuthError = (status) => {
  if (status === 401 || status === 403) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    window.dispatchEvent(new Event('storage'));
    if (!window.location.pathname.includes('/signin')) {
      window.location.href = '/signin';
    }
  }
};

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
  if (!response.ok) {
    const errorMsg = await response.text();
    const cleanErrorMessage = getErrorMessage(errorMsg);
    throw new Error(cleanErrorMessage || 'Failed to sign in user');
  }
  const data = await response.json();

  // Store JWT token and user — handle multiple possible backend response shapes
  const token = data.token || data.jwt || data.accessToken;
  const userObj = data.user || data.userDTO || data.userData;

  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userType', 'user');
    if (userObj) {
      localStorage.setItem('currentUser', JSON.stringify(userObj));
    } else if (data.id) {
      // backend returned the user object at the top level
      localStorage.setItem('currentUser', JSON.stringify(data));
    }
  }

  return data;
};

export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData),
  });
  // Always return the JSON, even for error cases, so frontend can handle message
  const data = await response.json();
  return data;
};

export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('Get user error response:', errorMsg);
      handleAuthError(response.status);
      const cleanErrorMessage = getErrorMessage(errorMsg);
      throw new Error(cleanErrorMessage || `Failed to fetch user details (Status: ${response.status})`);
    }

    const responseData = await response.json();
    // Handle both wrapped {success, user} and flat user object responses
    if (responseData.success && responseData.user) return responseData.user;
    if (responseData.id || responseData.userId) return responseData;
    if (responseData.user) return responseData.user;
    return responseData;
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
      const errorMsg = await response.text();
      console.error('Update user error response:', errorMsg);
      handleAuthError(response.status);
      const cleanErrorMessage = getErrorMessage(errorMsg);
      throw new Error(cleanErrorMessage || 'Failed to update user details');
    }

    const responseData = await response.json();
    if (responseData.success && responseData.user) return responseData.user;
    if (responseData.id || responseData.userId) return responseData;
    if (responseData.user) return responseData.user;
    return responseData;
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
      const errorMsg = await response.text();
      console.error('Change password error response:', errorMsg);
      handleAuthError(response.status);
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


