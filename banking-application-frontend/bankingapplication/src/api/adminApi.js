import { getErrorMessage } from '../utils/validation';

const BASE_URL = 'http://localhost:8083/api/admin/';

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
  [ErrorTypes.NETWORK]: 'Server not responding please try again',
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
    console.error('API Error:', errorLog);
  }
  
  // In production, send to monitoring service
  // Example: monitoringService.captureError(errorLog);
};

const determineErrorType = (response, error) => {
  // Network errors - enhanced detection
  if (!navigator.onLine) return ErrorTypes.NETWORK;
  
  // Check for common fetch failures
  if (error && (
    error.name === 'TypeError' ||
    error.message === 'Failed to fetch' ||
    error.message.includes('fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('ERR_CONNECTION_REFUSED') ||
    error.message.includes('ERR_NAME_NOT_RESOLVED')
  )) {
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
    
    // Handle network errors and connection refused with simple message
    let networkErrorMessage = 'Network connection failed';
    
    // Show simple message for network/connection issues
    if (error.message === 'Failed to fetch' || 
        error.name === 'TypeError' ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('fetch') ||
        error.message.includes('NetworkError')) {
      networkErrorMessage = 'Server not responding please try again';
    }
    
    const networkError = new ApiError(
      networkErrorMessage,
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

const pickFirst = (obj, keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};

const normalizeAdminData = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;

  // Some backends wrap admin object in `admin`, `data`, or `result`.
  const source = payload.admin || payload.data || payload.result || payload;
  if (!source || typeof source !== 'object') return payload;

  return {
    ...source,
    adminId: pickFirst(source, ['adminId', 'id', 'ID', '_id', 'admin_id']),
    id: pickFirst(source, ['id', 'adminId', 'ID', '_id', 'admin_id']),
    username: pickFirst(source, ['username', 'userName', 'name', 'adminName']),
    email: pickFirst(source, ['email', 'mail', 'emailAddress']),
    bankname: pickFirst(source, ['bankname', 'bankName', 'bank', 'bank_name']),
    country: pickFirst(source, ['country', 'countryName', 'locationCountry'])
  };
};

export const signUpAdmin = async (adminData) => {
  return await retryRequest(async () => {
    // Validate input data
    if (!adminData || typeof adminData !== 'object') {
      throw new ApiError('Invalid registration data provided', ErrorTypes.VALIDATION);
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
      `${BASE_URL}register`,
      {
        method: 'POST',
        body: JSON.stringify(adminData),
      },
      'Admin Registration'
    );
    
    return await response.text();
  });
};

export const signInAdmin = async (credentials) => {
  return await retryRequest(async () => {
    console.log(credentials);
    // Validate credentials
    if (!credentials || !credentials.usernameOrEmail || !credentials.password) {
      throw new ApiError('Username and password are required', ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}login`,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      'Admin Login'
    );
    
    const data = await response.json();
    return normalizeAdminData(data);
  });
};

/**
 * Get admin details by admin ID
 * @param {string} adminId - The admin ID
 * @returns {Promise<Object>} Admin data
 */
export const getAdminById = async (adminId) => {
  return await retryRequest(async () => {
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new ApiError('Invalid admin ID provided', ErrorTypes.VALIDATION);
    }
    
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new ApiError(`Admin ID must be a valid number, received: ${adminId}`, ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericAdminId}`,
      { method: 'GET' },
      'Get Admin Details'
    );
    
    const adminData = await response.json();
    return normalizeAdminData(adminData);
  });
};

/**
 * Update admin details (username and email)
 * @param {string} adminId - The admin ID
 * @param {Object} updateData - Object containing username and email
 * @returns {Promise<Object>} Updated admin data
 */
export const updateAdminDetails = async (adminId, updateData) => {
  return await retryRequest(async () => {
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new ApiError('Invalid admin ID. Please ensure you are properly logged in.', ErrorTypes.AUTHENTICATION);
    }
    
    // Validate update data
    if (!updateData || typeof updateData !== 'object') {
      throw new ApiError('Invalid update data provided', ErrorTypes.VALIDATION);
    }
    
    if (!updateData.username || !updateData.email) {
      throw new ApiError('Username and email are required', ErrorTypes.VALIDATION);
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.email)) {
      throw new ApiError('Please enter a valid email address', ErrorTypes.VALIDATION);
    }
    
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new ApiError(`Admin ID must be a valid number, received: ${adminId}`, ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericAdminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          username: updateData.username,
          email: updateData.email
        })
      },
      'Update Admin Details'
    );
    
    const updatedAdmin = await response.json();
    return normalizeAdminData(updatedAdmin);
  });
};

/**
 * Change admin password
 * @param {string} adminId - The admin ID
 * @param {Object} passwordData - Object containing current and new passwords
 * @returns {Promise<Object>} Success response
 */
export const changeAdminPassword = async (adminId, passwordData) => {
  return await retryRequest(async () => {
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new ApiError('Invalid admin ID. Please ensure you are properly logged in.', ErrorTypes.AUTHENTICATION);
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
    
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new ApiError(`Admin ID must be a valid number, received: ${adminId}`, ErrorTypes.VALIDATION);
    }
    
    const requestBody = {
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    };
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericAdminId}/password`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      },
      'Change Password'
    );
    
    // Handle both JSON and text responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const textResult = await response.text();
      return { message: textResult, success: true };
    }
  });
};

/**
 * Simple update admin details (fallback approach)
 * Uses the same pattern as existing login/register endpoints
 */
export const updateAdminDetailsSimple = async (adminId, updateData) => {
  return await retryRequest(async () => {
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new ApiError('Invalid admin ID. Please ensure you are properly logged in.', ErrorTypes.AUTHENTICATION);
    }
    
    // Validate update data
    if (!updateData || typeof updateData !== 'object') {
      throw new ApiError('Invalid update data provided', ErrorTypes.VALIDATION);
    }
    
    if (!updateData.username || !updateData.email) {
      throw new ApiError('Username and email are required', ErrorTypes.VALIDATION);
    }
    
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new ApiError(`Admin ID must be a valid number, received: ${adminId}`, ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}${numericAdminId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          username: updateData.username,
          email: updateData.email
        })
      },
      'Simple Admin Update'
    );
    
    // Handle both JSON and text responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return normalizeAdminData(result);
    } else {
      const textResult = await response.text();
      return { message: textResult, success: true };
    }
  });
};

/**
 * Test API connection
 * @returns {Promise<string>} Success message
 */
export const testApiConnection = async () => {
  return await retryRequest(async () => {
    const response = await makeApiRequest(
      `${BASE_URL}test`,
      { method: 'GET' },
      'Test API Connection'
    );
    
    return await response.text();
  }, 1); // Only retry once for connection tests
};

// Export error types and utilities for use in components
export { ApiError, ErrorTypes, UserFriendlyMessages };


