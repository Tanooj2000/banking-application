// Comprehensive validation utility functions

/**
 * Extracts user-friendly error message from backend response
 * Handles various error response formats and returns clean message
 */
export const getErrorMessage = (error) => {
  // If it's already a string, check if it's a JSON string
  if (typeof error === 'string') {
    try {
      // Try to parse as JSON in case backend sent JSON as string
      const parsedError = JSON.parse(error);
      if (parsedError?.message) {
        return parsedError.message;
      }
      if (parsedError?.error) {
        return parsedError.error;
      }
    } catch (e) {
      // Not JSON, return as is
      return error;
    }
    return error;
  }

  // Check if it's an error object with a message
  if (error?.message) {
    // Check if the message itself is a JSON string
    if (typeof error.message === 'string') {
      try {
        const parsedMessage = JSON.parse(error.message);
        if (parsedMessage?.message) {
          return parsedMessage.message;
        }
        if (parsedMessage?.error) {
          return parsedMessage.error;
        }
      } catch (e) {
        // Not JSON, return the message as is
        return error.message;
      }
    }
    return error.message;
  }

  // Check for response data message (common in axios errors)
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for response data error
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Check for response data as string
  if (typeof error?.response?.data === 'string') {
    try {
      // Try to parse response data as JSON
      const parsedData = JSON.parse(error.response.data);
      if (parsedData?.message) {
        return parsedData.message;
      }
      if (parsedData?.error) {
        return parsedData.error;
      }
    } catch (e) {
      // Not JSON, return as is
      return error.response.data;
    }
    return error.response.data;
  }

  // Check for response status text
  if (error?.response?.statusText) {
    return `Request failed: ${error.response.statusText}`;
  }

  // Check for network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Check for timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Default fallback message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Validates Gmail address
 * Must be a valid Gmail address ending with @gmail.com
 */
export const validateGmail = (email) => {
  if (!email) return { isValid: false, message: 'Email is required' };
  
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return { 
      isValid: false, 
      message: 'Please enter a valid Gmail address (example@gmail.com)' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates password strength
 * Must be minimum 8 characters with at least:
 * - One lowercase letter
 * - One uppercase letter  
 * - One special character
 * - One number
 */
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }
  
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasLowercase) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }
  
  if (!hasUppercase) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }
  
  if (!hasNumber) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one number' 
    };
  }
  
  if (!hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one special character (!@#$%^&*...)' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates name field
 * Must be minimum 6 characters
 * Only letters allowed, no spaces or special characters
 */
export const validateName = (name) => {
  if (!name) return { isValid: false, message: 'Name is required' };
  
  if (name.length < 5) {
    return { 
      isValid: false, 
      message: 'Name must be at least 5 characters long' 
    };
  }
  
  // Check for any non-letter characters (including spaces, numbers, special chars)
  const hasInvalidChars = /[^a-zA-Z]/.test(name);
  if (hasInvalidChars) {
    return { 
      isValid: false, 
      message: 'Name can only contain letters (no spaces, numbers, or special characters)' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates confirm password
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return { isValid: false, message: 'Please confirm your password' };
  
  if (password !== confirmPassword) {
    return { 
      isValid: false, 
      message: 'Passwords do not match' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates mobile number (10 digits)
 */
export const validateMobile = (mobile) => {
  if (!mobile) return { isValid: false, message: 'Mobile number is required' };
  
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile)) {
    return { 
      isValid: false, 
      message: 'Please enter a valid 10-digit mobile number' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates bank name
 */
export const validateBankName = (bankName) => {
  if (!bankName) return { isValid: false, message: 'Bank name is required' };
  
  if (bankName.length < 2) {
    return { 
      isValid: false, 
      message: 'Bank name must be at least 2 characters long' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates username (using same rules as name for consistency)
 */
export const validateUsername = (username) => {
  return validateName(username);
};

/**
 * Validates full name field (for forms like CreateAccount where spaces might be needed)
 * Must be minimum 6 characters
 * Only letters and spaces allowed
 * Spaces only allowed between words (not at start/end)
 */
export const validateFullName = (name) => {
  if (!name) return { isValid: false, message: 'Full name is required' };
  
  if (name.length < 6) {
    return { 
      isValid: false, 
      message: 'Full name must be at least 6 characters long' 
    };
  }
  
  // Check for numbers or special characters (except spaces)
  const hasInvalidChars = /[^a-zA-Z\s]/.test(name);
  if (hasInvalidChars) {
    return { 
      isValid: false, 
      message: 'Full name can only contain letters and spaces' 
    };
  }
  
  // Check for spaces at start or end
  if (name.trim() !== name) {
    return { 
      isValid: false, 
      message: 'Full name cannot start or end with spaces' 
    };
  }
  
  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(name)) {
    return { 
      isValid: false, 
      message: 'Full name cannot contain multiple consecutive spaces' 
    };
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) {
    return { 
      isValid: false, 
      message: 'Full name must contain at least one letter' 
    };
  }
  
  return { isValid: true, message: '' };
};