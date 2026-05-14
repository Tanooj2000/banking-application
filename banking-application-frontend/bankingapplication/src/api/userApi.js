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
  [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection and try again.',
  [ErrorTypes.AUTHENTICATION]: 'Your session has expired. Please sign in again.',
  [ErrorTypes.VALIDATION]: 'Please check the information you entered and try again.',
  [ErrorTypes.SERVER]: 'A server error occurred. Our team has been notified. Please try again later.',
  [ErrorTypes.NOT_FOUND]: 'The requested information was not found.',
  [ErrorTypes.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorTypes.TIMEOUT]: 'The request timed out. Please try again.'
};

const resolveUserMessage = (message, type, statusCode) => {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  const genericStatusPattern = /^Request failed with status\s+\d+$/i;

  // For validation/auth/not-found errors, prefer specific backend message.
  if ([ErrorTypes.VALIDATION, ErrorTypes.AUTHENTICATION, ErrorTypes.NOT_FOUND].includes(type)) {
    if (trimmed && !genericStatusPattern.test(trimmed)) {
      return trimmed;
    }
  }

  // Keep friendly generic messages for transport/server style failures.
  if ([ErrorTypes.NETWORK, ErrorTypes.SERVER, ErrorTypes.TIMEOUT, ErrorTypes.RATE_LIMIT, ErrorTypes.PERMISSION].includes(type)) {
    return UserFriendlyMessages[type] || trimmed || 'An unexpected error occurred. Please try again.';
  }

  // Fallback to backend message if meaningful; otherwise generic type message.
  if (trimmed && !genericStatusPattern.test(trimmed)) {
    return trimmed;
  }
  return UserFriendlyMessages[type] || `Request failed (${statusCode || 'unknown'}). Please try again.`;
};

class ApiError extends Error {
  constructor(message, type, statusCode = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.userMessage = resolveUserMessage(message, type, statusCode);
    this.timestamp = new Date().toISOString();
  }
}

const logError = (operation, error, context = {}) => {
  const isNetworkFetchNoise = error?.type === ErrorTypes.NETWORK &&
    (error?.message?.includes('Failed to fetch') || error?.message?.toLowerCase?.().includes('fetch'));
  const isLoginOperation = operation === 'User Login';
  const isExpectedLoginFailure = isLoginOperation &&
    [ErrorTypes.VALIDATION, ErrorTypes.AUTHENTICATION, ErrorTypes.NETWORK].includes(error?.type);

  const errorLog = {
    operation,
    error: {
      name: error.name,
      message: isNetworkFetchNoise ? 'Network request failed' : error.message,
      type: error.type || 'UNKNOWN',
      statusCode: error.statusCode,
      stack: isNetworkFetchNoise ? undefined : error.stack
    },
    context,
    timestamp: new Date().toISOString()
  };
  
  // Log to console in development, send to monitoring service in production
  if (process.env.NODE_ENV === 'development') {
    if (isLoginOperation) {
      console.warn('User Login Failed:', {
        type: error?.type || 'UNKNOWN',
        statusCode: error?.statusCode ?? null,
        timestamp: errorLog.timestamp,
      });
      return;
    }

    if (isNetworkFetchNoise) {
      console.warn('User API Network Error:', {
        operation,
        type: error.type,
        timestamp: errorLog.timestamp,
      });
    } else {
      console.error('User API Error:', errorLog);
    }
  }
  
  // In production, send to monitoring service
  // Example: monitoringService.captureError(errorLog);
};

const determineErrorType = (response, error) => {
  // Network errors
  if (!navigator.onLine) return ErrorTypes.NETWORK;
  const errorMessage = typeof error?.message === 'string' ? error.message : '';
  if (error && ((error.name === 'TypeError' && errorMessage.includes('fetch')) || errorMessage === 'Failed to fetch')) {
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
    const { skipAuth = false, ...restOptions } = options;
    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(skipAuth ? {} : getAuthHeaders()),
      ...(restOptions.headers || {})
    };

    const defaultOptions = {
      headers: requestHeaders,
      signal: controller.signal,
      ...restOptions
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
      UserFriendlyMessages[ErrorTypes.NETWORK],
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
        skipAuth: true,
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
    const usernameOrEmail = credentials?.usernameOrEmail?.trim?.() || '';
    const password = credentials?.password || '';

    if (!usernameOrEmail || !password) {
      throw new ApiError('Username/email and password are required', ErrorTypes.VALIDATION);
    }

    // Ensure stale auth data never interferes with login call.
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');

    const loginPayload = {
      usernameOrEmail,
      password,
    };
    
    const response = await makeApiRequest(
      `${BASE_URL}login`,
      {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(loginPayload),
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
        const normalizedUser = { ...userObj };
        const normalizedId = normalizedUser.id ?? normalizedUser.userId ?? normalizedUser.user_id ?? null;
        if (normalizedId !== null && normalizedId !== undefined && normalizedId !== '') {
          normalizedUser.id = normalizedId;
          normalizedUser.userId = normalizedId;
          localStorage.setItem('userId', String(normalizedId));
        }
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
      } else if (data.id) {
        localStorage.setItem('currentUser', JSON.stringify(data));
        localStorage.setItem('userId', String(data.id));
      }
    } else {
      throw new ApiError('Authentication token not received from server', ErrorTypes.AUTHENTICATION);
    }
    
    return data;
  }, 0);
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


