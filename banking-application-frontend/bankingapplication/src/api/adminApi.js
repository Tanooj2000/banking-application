import { getErrorMessage } from '../utils/validation';

const BASE_URL = 'http://localhost:8083/api/admin/';

export const signUpAdmin = async (adminData) => {
  const response = await fetch(`${BASE_URL}register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData),
  });
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to sign up user');
  }
  return response.text();
};

export const signInAdmin = async (credentials) => {
  const response = await fetch(`${BASE_URL}login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to sign in admin');
  }
  const data = await response.json();

  return data;
};

/**
 * Get admin details by admin ID
 * @param {string} adminId - The admin ID
 * @returns {Promise<Object>} Admin data
 */
export const getAdminById = async (adminId) => {
  try {
    const response = await fetch(`${BASE_URL}${adminId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Use getErrorMessage to extract clean message from JSON response
      const cleanErrorMessage = getErrorMessage(errorText);
      throw new Error(cleanErrorMessage);
    }

    const adminData = await response.json();
    console.log('Admin data fetched successfully:', adminData);
    return adminData;
  } catch (error) {
    console.error('Error fetching admin by ID:', error);
    throw new Error(`Failed to fetch admin details: ${error.message}`);
  }
};

/**
 * Update admin details (username and email)
 * @param {string} adminId - The admin ID
 * @param {Object} updateData - Object containing username and email
 * @returns {Promise<Object>} Updated admin data
 */
export const updateAdminDetails = async (adminId, updateData) => {
  try {
    console.log('Updating admin details for ID:', adminId, 'with data:', updateData);
    
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new Error('Invalid admin ID. Please ensure you are properly logged in.');
    }

    // Convert adminId to number for backend compatibility
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new Error(`Admin ID must be a valid number, got: ${adminId}`);
    }
    
    console.log('Using numeric admin ID:', numericAdminId);
    
    const response = await fetch(`${BASE_URL}${numericAdminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: updateData.username,
        email: updateData.email
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Admin update failed with status:', response.status, 'Error:', errorText);
      // Use getErrorMessage to extract clean message from JSON response
      const cleanErrorMessage = getErrorMessage(errorText);
      throw new Error(cleanErrorMessage);
    }

    const updatedAdmin = await response.json();
    console.log('Admin details updated successfully:', updatedAdmin);
    return updatedAdmin;
  } catch (error) {
    console.error('Error updating admin details:', error);
    throw new Error(`Failed to update admin details: ${error.message}`);
  }
};

/**
 * Change admin password
 * @param {string} adminId - The admin ID
 * @param {Object} passwordData - Object containing current and new passwords
 * @returns {Promise<Object>} Success response
 */
export const changeAdminPassword = async (adminId, passwordData) => {
  try {
    console.log('Changing password for admin ID:', adminId);
    
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new Error('Invalid admin ID. Please ensure you are properly logged in.');
    }

    // Convert adminId to number for backend compatibility
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new Error(`Admin ID must be a valid number, got: ${adminId}`);
    }
    
    console.log('Using numeric admin ID for password change:', numericAdminId);
    
    // Create request body matching backend ChangePasswordRequest
    const requestBody = {
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    };
    
    console.log('Password change request body:', requestBody);
    
    const response = await fetch(`${BASE_URL}${numericAdminId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Password change failed with status:', response.status, 'Error:', errorText);
      // Use getErrorMessage to extract clean message from JSON response
      const cleanErrorMessage = getErrorMessage(errorText);
      throw new Error(cleanErrorMessage);
    }

    // Handle both JSON and text responses from backend
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // Backend returns plain text response
      const textResult = await response.text();
      result = { message: textResult, success: true };
    }
    
    console.log('Admin password changed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error changing admin password:', error);
    throw new Error(`Failed to change password: ${error.message}`);
  }
};

/**
 * Simple update admin details (fallback approach)
 * Uses the same pattern as existing login/register endpoints
 */
export const updateAdminDetailsSimple = async (adminId, updateData) => {
  try {
    console.log('Simple update for admin ID:', adminId, 'with data:', updateData);
    
    // Validate adminId
    if (!adminId || adminId === 'undefined' || adminId === 'null') {
      throw new Error('Invalid admin ID. Please ensure you are properly logged in.');
    }

    // Convert adminId to number for backend compatibility
    const numericAdminId = parseInt(adminId, 10);
    if (isNaN(numericAdminId)) {
      throw new Error(`Admin ID must be a valid number, got: ${adminId}`);
    }
    
    // Try PUT method instead of POST (based on backend logs)
    const response = await fetch(`${BASE_URL}${numericAdminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: updateData.username,
        email: updateData.email
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Use getErrorMessage to extract clean message from JSON response
      const cleanErrorMessage = getErrorMessage(errorText);
      throw new Error(cleanErrorMessage);
    }

    // Handle both JSON and text responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      console.log('Admin updated (JSON response):', result);
      return result;
    } else {
      const result = await response.text();
      console.log('Admin updated (text response):', result);
      return { message: result, success: true };
    }
  } catch (error) {
    console.error('Error in simple admin update:', error);
    throw error;
  }
};

/**
 * Test API connection
 * @returns {Promise<string>} Success message
 */
export const testApiConnection = async () => {
  const response = await fetch(`${BASE_URL}test`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('API connection test failed');
  }
  return await response.text();
};


