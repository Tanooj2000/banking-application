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

    if (response.ok) {
      // Store token and user data on successful login with safety checks
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('adminUser', JSON.stringify(data.user));
      }
      
      return {
        success: true,
        data: data,
        message: 'Sign in successful'
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
