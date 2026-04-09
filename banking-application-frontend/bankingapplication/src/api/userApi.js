// src/api/userApi.js
import { getErrorMessage } from '../utils/validation';
import { AuthGuard } from '../utils/authGuard';

const BASE_URL = 'http://localhost:8081/api/user/';

// Production error handling utilities
const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT_ERROR'
};

const UserFriendlyMessages = {
  [ErrorTypes.NETWORK]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ErrorTypes.AUTHENTICATION]: 'Your session has expired. Please sign in again.',
  [ErrorTypes.VALIDATION]: 'Please check the information you entered and try again.',
  [ErrorTypes.SERVER]: 'A server error occurred. Our team has been notified. Please try again later.',
  [ErrorTypes.NOT_FOUND]: 'The requested information was not found.',
  [ErrorTypes.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorTypes.TIMEOUT]: 'The request timed out. Please try again.'
};

class ApiError extends Error {
  constructor(message, type, statusCode = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.userMessage = UserFriendlyMessages[type] || message;
    this.timestamp = new Date().toISOString();
  }
}

const logError = (operation, error, context = {}) => {
  const errorLog = {
    operation,
    error: {
      name: error.name,
      message: error.message,
      type: error.type || 'UNKNOWN',
      statusCode: error.statusCode,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  };
  
  // Log to console in development, send to monitoring service in production
  if (process.env.NODE_ENV === 'development') {
    console.error('User API Error:', errorLog);
  }
  
  // In production, send to monitoring service
  // Example: monitoringService.captureError(errorLog);
};

const determineErrorType = (response, error) => {
  // Network errors
  if (!navigator.onLine) return ErrorTypes.NETWORK;
  if (error && (error.name === 'TypeError' && error.message.includes('fetch')) || error.message === 'Failed to fetch') {
    return ErrorTypes.NETWORK;
  }
  
  if (!response) return ErrorTypes.NETWORK;
  
  // HTTP status based errors
  switch (response.status) {
    case 400: return ErrorTypes.VALIDATION;
    case 401: return ErrorTypes.AUTHENTICATION;
    case 403: return ErrorTypes.PERMISSION;
    case 404: return ErrorTypes.NOT_FOUND;
    case 429: return ErrorTypes.RATE_LIMIT;
    case 408: return ErrorTypes.TIMEOUT;
    case 500:
    case 502:
    case 503:
    case 504: return ErrorTypes.SERVER;
    default: return ErrorTypes.SERVER;
  }
};

const handleApiResponse = async (response, operation) => {
  if (!response.ok) {
    let errorMessage;
    let errorDetails = null;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
        errorDetails = errorData;
      } else {
        errorMessage = await response.text() || `Request failed with status ${response.status}`;
      }
    } catch (parseError) {
      errorMessage = `Server error (${response.status}). Please try again later.`;
    }
    
    const errorType = determineErrorType(response);
    
    // Handle auth errors
    if (errorType === ErrorTypes.AUTHENTICATION || errorType === ErrorTypes.PERMISSION) {
      handleAuthError(response.status);
    }
    
    throw new ApiError(errorMessage, errorType, response.status, errorDetails);
  }
  
  return response;
};

const makeApiRequest = async (url, options = {}, operation = 'API Request') => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      signal: controller.signal,
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    clearTimeout(timeoutId);
    
    return await handleApiResponse(response, operation);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new ApiError('Request timed out', ErrorTypes.TIMEOUT);
      logError(operation, timeoutError, { url, options });
      throw timeoutError;
    }
    
    if (error instanceof ApiError) {
      logError(operation, error, { url, options });
      throw error;
    }
    
    // Handle network errors
    const networkError = new ApiError(
      error.message || 'Network connection failed',
      ErrorTypes.NETWORK,
      null,
      error
    );
    logError(operation, networkError, { url, options });
    throw networkError;
  }
};

const retryRequest = async (requestFn, maxRetries = 2, delay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry validation, authentication, or permission errors
      if ([ErrorTypes.VALIDATION, ErrorTypes.AUTHENTICATION, ErrorTypes.PERMISSION].includes(error.type)) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
};

// Enhanced authentication helpers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Handle authentication errors with proper cleanup
const handleAuthError = (status) => {
  if (status === 401 || status === 403) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    window.dispatchEvent(new Event('storage'));
    
    // Only redirect if not already on signin page
    if (!window.location.pathname.includes('/signin')) {
      // Delay redirect to allow error message to be shown
      setTimeout(() => {
        window.location.href = '/signin';
      }, 1500);
    }
  }
};

export const signUpUser = async (userData) => {
  return await retryRequest(async () => {
    // Validate input data
    if (!userData || typeof userData !== 'object') {
      throw new ApiError('Invalid registration data provided', ErrorTypes.VALIDATION);
    }
    
    const requiredFields = ['username', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missingFields.join(', ')}`,
        ErrorTypes.VALIDATION
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ApiError('Please enter a valid email address', ErrorTypes.VALIDATION);
    }
    
    // Password validation
    if (userData.password.length < 6) {
      throw new ApiError('Password must be at least 6 characters long', ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}register`,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
      'User Registration'
    );
    
    return await response.text();
  });
};

export const signInUser = async (credentials) => {
  return await retryRequest(async () => {
    // Validate credentials
    if (!credentials || !credentials.usernameOrEmail || !credentials.password) {
      throw new ApiError('Username/email and password are required', ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}login`,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      'User Login'
    );
    
    const data = await response.json();
    
    // Store JWT token and user data
    const token = data.token || data.jwt || data.accessToken;
    const userObj = data.user || data.userDTO || data.userData;
    
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userType', 'user');
      
      if (userObj) {
        localStorage.setItem('currentUser', JSON.stringify(userObj));
      } else if (data.id) {
        localStorage.setItem('currentUser', JSON.stringify(data));
      }
    } else {
      throw new ApiError('Authentication token not received from server', ErrorTypes.AUTHENTICATION);
    }
    
    return data;
  });
};

export const signUpAdmin = async (adminData) => {
  return await retryRequest(async () => {
    // Validate input data
    if (!adminData || typeof adminData !== 'object') {
      throw new ApiError('Invalid admin registration data provided', ErrorTypes.VALIDATION);
    }
    
    const requiredFields = ['username', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !adminData[field]);
    if (missingFields.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missingFields.join(', ')}`,
        ErrorTypes.VALIDATION
      );
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}admins`,
      {
        method: 'POST',
        body: JSON.stringify(adminData),
      },
      'Admin Registration'
    );
    
    return await response.json();
  });
};

export const getUserById = async (userId) => {
  return await retryRequest(async () => {
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID provided', ErrorTypes.VALIDATION);
    }
    
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new ApiError(`User ID must be a valid number, received: ${userId}`, ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericUserId}`,
      { method: 'GET' },
      'Get User Details'
    );
    
    // Check if response has content
    const responseText = await response.text();
    if (!responseText) {
      console.warn('Backend returned empty response - using localStorage fallback');
      const currentUser = AuthGuard.getCurrentUser();
      if (currentUser && (currentUser.id == userId || currentUser.userId == userId)) {
        return currentUser;
      }
      throw new ApiError('User data not found', ErrorTypes.NOT_FOUND);
    }
    
    const responseData = JSON.parse(responseText);
    
    // Handle different response formats
    if (responseData.success && responseData.user) return responseData.user;
    if (responseData.id || responseData.userId) return responseData;
    if (responseData.user) return responseData.user;
    return responseData;
  });
};

export const updateUserDetails = async (userId, userData) => {
  return await retryRequest(async () => {
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID. Please ensure you are properly logged in.', ErrorTypes.AUTHENTICATION);
    }
    
    // Validate update data
    if (!userData || typeof userData !== 'object') {
      throw new ApiError('Invalid update data provided', ErrorTypes.VALIDATION);
    }
    
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new ApiError(`User ID must be a valid number, received: ${userId}`, ErrorTypes.VALIDATION);
    }
    
    // Validate email if provided
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new ApiError('Please enter a valid email address', ErrorTypes.VALIDATION);
      }
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericUserId}`,
      {
        method: 'PUT',
        body: JSON.stringify(userData)
      },
      'Update User Details'
    );
    
    // Handle response
    const responseText = await response.text();
    let responseData;
    
    if (!responseText) {
      console.warn('Backend update successful but returned empty response');
      // Update localStorage with new data since update was successful
      const currentUser = AuthGuard.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return { id: userId, ...userData, message: 'Update successful' };
    }
    
    responseData = JSON.parse(responseText);
    
    // Update localStorage with latest user data
    const finalUserData = responseData.success && responseData.user ? responseData.user : 
                         (responseData.id || responseData.userId ? responseData : responseData.user || responseData);
    
    if (finalUserData && (finalUserData.id || finalUserData.userId)) {
      localStorage.setItem('currentUser', JSON.stringify(finalUserData));
    }
    
    return finalUserData;
  });
};

export const changeUserPassword = async (userId, passwordData) => {
  return await retryRequest(async () => {
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID. Please ensure you are properly logged in.', ErrorTypes.AUTHENTICATION);
    }
    
    // Validate password data
    if (!passwordData || typeof passwordData !== 'object') {
      throw new ApiError('Invalid password data provided', ErrorTypes.VALIDATION);
    }
    
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      throw new ApiError('Current password and new password are required', ErrorTypes.VALIDATION);
    }
    
    // Password strength validation
    if (passwordData.newPassword.length < 6) {
      throw new ApiError('New password must be at least 6 characters long', ErrorTypes.VALIDATION);
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      throw new ApiError('New password must be different from current password', ErrorTypes.VALIDATION);
    }
    
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new ApiError(`User ID must be a valid number, received: ${userId}`, ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericUserId}/password`,
      {
        method: 'PUT',
        body: JSON.stringify(passwordData)
      },
      'Change Password'
    );
    
    return await response.text();
  });
};

// Export error types and utilities for use in components
export { ApiError, ErrorTypes, UserFriendlyMessages };


