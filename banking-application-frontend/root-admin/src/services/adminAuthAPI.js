// Admin Sign In API method
const API_BASE_URL = 'http://localhost:8084/api/root';

/**
 * Sign in admin user by calling backend API
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<Object>} Response with success status and data
 */
export const adminSignIn = async (username, password) => {
  try {
    console.log('Attempting to connect to:', `${API_BASE_URL}/signin`);
    
    const response = await fetch(`${API_BASE_URL}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await response.json();
    console.log('Backend response:', data);

    if (response.ok && data.success) {
      // Handle different response formats for token
      let token = null;
      
      // Check if token is directly in data.token
      if (data.token) {
        token = data.token;
      }
      // Check if response is array format [success, message, token]
      else if (Array.isArray(data) && data.length >= 3) {
        token = data[2];
      }
      // Check if token is in a nested structure
      else if (data.data && data.data.token) {
        token = data.data.token;
      }
      
      // Store token if found
      if (token) {
        localStorage.setItem('adminToken', token);
        console.log('JWT Token stored successfully');
        
        // Extract user info from JWT token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Validate required fields exist in JWT
          if (!payload.sub || !payload.role) {
            console.error('JWT missing required fields:', payload);
            throw new Error('Invalid JWT token structure');
          }
          
          const userInfo = {
            username: payload.sub,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat
          };
          localStorage.setItem('adminUser', JSON.stringify(userInfo));
          console.log('User info extracted from JWT:', userInfo);
        } catch (decodeError) {
          console.warn('Could not decode JWT payload:', decodeError);
          // Don't store invalid user data
        }
      } else {
        console.warn('No token found in response');
      }
      
      // Store additional user data if available in response
      if (data.user) {
        localStorage.setItem('adminUser', JSON.stringify(data.user));
      }
      
      return {
        success: true,
        data: data,
        token: token,
        message: data.message || 'Sign in successful'
      };
    } else {
      return {
        success: false,
        error: data.message || 'Sign in failed',
        status: response.status
      };
    }

  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      details: error.message
    };
  }
};

export default adminSignIn;

/**
 * Check if admin is authenticated (has valid token)
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;
  
  // Check if JWT token is expired
  return !isTokenExpired(token);
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Get current admin token
 * @returns {string|null} Token if available
 */
export const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

/**
 * Get current admin user data
 * @returns {Object|null} User data if available
 */
export const getAdminUser = () => {
  const userData = localStorage.getItem('adminUser');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Sign out admin user by clearing stored data
 */
export const adminSignOut = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  console.log('Admin signed out successfully');
};

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers with authorization
 * @throws {Error} If no valid token is available
 */
export const getAuthHeaders = () => {
  const token = getAdminToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  if (isTokenExpired(token)) {
    // Auto-logout if token is expired
    adminSignOut();
    throw new Error('Authentication token has expired');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
