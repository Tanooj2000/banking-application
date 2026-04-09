// src/api/bankApi.js

const BASE_URL = 'http://localhost:8082/api';

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
  [ErrorTypes.NOT_FOUND]: 'The requested bank information was not found.',
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
    console.error('Bank API Error:', errorLog);
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
      mode: 'cors',
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

// Fixed countries - no need for API call
export const getAvailableCountries = () => {
  try {
    const countries = ['India', 'USA', 'UK'];
    if (!Array.isArray(countries) || countries.length === 0) {
      throw new ApiError('No countries available', ErrorTypes.NOT_FOUND);
    }
    return countries;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to get available countries', ErrorTypes.SERVER, null, error);
  }
};

export const fetchBanks = async (country) => {
  return await retryRequest(async () => {
    // Validate country parameter
    if (!country || typeof country !== 'string') {
      throw new ApiError('Country name is required and must be a valid string', ErrorTypes.VALIDATION);
    }
    
    const validCountries = getAvailableCountries();
    if (!validCountries.includes(country)) {
      throw new ApiError(
        `Invalid country '${country}'. Available countries: ${validCountries.join(', ')}`,
        ErrorTypes.VALIDATION
      );
    }
    
    const url = `${BASE_URL}/banks/country/${encodeURIComponent(country)}`;
    
    const response = await makeApiRequest(
      url,
      { method: 'GET' },
      `Fetch Banks for ${country}`
    );
    
    const banks = await response.json();
    
    if (!Array.isArray(banks)) {
      console.warn('Backend returned non-array response for banks:', banks);
      return [];
    }
    
    return banks;
  });
};

export const fetchBankById = async (bankId) => {
  return await retryRequest(async () => {
    // Validate bankId parameter
    if (!bankId && bankId !== 0) {
      throw new ApiError('Bank ID is required', ErrorTypes.VALIDATION);
    }
    
    // Convert to number and validate
    const numericBankId = parseInt(bankId, 10);
    if (isNaN(numericBankId)) {
      throw new ApiError(`Bank ID must be a valid number, received: ${bankId}`, ErrorTypes.VALIDATION);
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}/banks/${numericBankId}`,
      { method: 'GET' },
      `Fetch Bank Details for ID ${numericBankId}`
    );
    
    const data = await response.json();
    
    // Handle different response formats
    if (data.success === false) {
      throw new ApiError(data.message || 'Bank not found', ErrorTypes.NOT_FOUND);
    }
    
    if (data.success && data.bank) {
      return data.bank;
    }
    
    // If data has bank properties directly
    if (data.bankId || data.id || data.name) {
      return data;
    }
    
    // Fallback for unexpected response format
    return data;
  });
};

export const createBranch = async (branchData) => {
  console.log('Data:', branchData);
  return await retryRequest(async () => {
    // Validate branch data
    if (!branchData || typeof branchData !== 'object') {
      throw new ApiError('Branch data is required and must be a valid object', ErrorTypes.VALIDATION);
    }
    
    // Validate branch code format (assuming it should be alphanumeric)
    if (branchData.branchCode && !/^[A-Za-z0-9]+$/.test(branchData.branchCode)) {
      throw new ApiError(
        'Branch code must contain only letters and numbers',
        ErrorTypes.VALIDATION
      );
    }
    
    // Validate bank name length
    if (branchData.bankName && branchData.bankName.length < 2) {
      throw new ApiError(
        'Bank name must be at least 2 characters long',
        ErrorTypes.VALIDATION
      );
    }
    
    const response = await makeApiRequest(
      `${BASE_URL}/banks/add`,
      {
        method: 'POST',
        body: JSON.stringify(branchData)
      },
      'Create Bank Branch'
    );
    
    return await response.json();
  });
};

// Export error types and utilities for use in components
export { ApiError, ErrorTypes, UserFriendlyMessages };