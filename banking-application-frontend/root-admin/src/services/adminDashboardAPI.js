// Admin Dashboard API service
import { getAuthHeaders, adminSignOut } from './adminAuthAPI';

const API_BASE_URL = 'http://localhost:8083';

/**
 * Handle authentication errors and auto-logout if needed
 * @param {Response} response - Fetch response object
 */
const handleAuthError = (response) => {
  if (response.status === 401) {
    console.warn('Authentication failed. Signing out...');
    adminSignOut();
    // Optionally redirect to login page
    window.location.href = '/admin/signin';
  }
};

/**
 * Admin Dashboard API Service for managing applications
 */
export class AdminDashboardAPI {
  
  /**
   * Get authentication headers with token (deprecated - use centralized version)
   * @returns {Object} Headers object with authorization
   * @deprecated Use getAuthHeaders from adminAuthAPI instead
   */
  static getAuthHeaders() {
    return getAuthHeaders();
  }

  /**
   * Fetch all pending applications
   * @returns {Promise<Object>} Response with applications data
   */
  static async getPendingApplications() {
    console.log('Fetching pending applications from:', `${API_BASE_URL}/api/admin/applications/pending`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/pending`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        // Check if response has content
        const text = await response.text();
        if (text.trim()) {
          data = JSON.parse(text);
        } else {
          // Empty response
          console.warn('Empty response received for pending applications');
          data = [];
        }
      } else {
        // Non-JSON response, treat as empty array
        data = [];
      }
      
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('Error fetching pending applications:', error);
      
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        console.warn('Authentication error, redirecting to signin');
        window.location.href = '/admin/signin';
        return {
          success: false,
          error: 'Please sign in again',
          authError: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to fetch applications',
        status: error.status
      };
    }
  }

  /**
   * Approve an application
   * @param {number} adminId - ID of the admin application to approve
   * @param {string} reason - Optional reason for approval
   * @returns {Promise<Object>} Response with success status
   */
  static async approveApplication(adminId, reason = 'Application meets all requirements and documentation is complete') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/${adminId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rootUsername: "rootadmin",
          rootPassword: "rootpass",
          reason: reason
        }),
      });

      if (!response.ok) {
        handleAuthError(response);
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          // If can't read response, use default message
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, treat as text response - backend might return plain text
        const textResponse = await response.text();
        data = { message: textResponse };
      }

      return {
        success: true,
        data: data,
        message: data.message || 'Application approved successfully'
      };

    } catch (error) {
      console.error('Error approving application:', error);
      
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        console.warn('Authentication error, redirecting to signin');
        window.location.href = '/admin/signin';
        return {
          success: false,
          error: 'Please sign in again',
          authError: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to approve application',
        status: error.status
      };
    }
  }

  /**
   * Reject an application
   * @param {number} adminId - ID of the admin application to reject
   * @param {string} reason - Optional reason for rejection
   * @returns {Promise<Object>} Response with success status
   */
  static async rejectApplication(adminId, reason = 'Application does not meet the required criteria') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/${adminId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rootUsername: "rootadmin",
          rootPassword: "rootpass",
          reason: reason
        }),
      });

      if (!response.ok) {
        handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (likely text/HTML from backend)
        const textResponse = await response.text();
        console.log('Non-JSON response received:', textResponse);
        data = { message: textResponse };
      }

      return {
        success: true,
        data: data,
        message: 'Application rejected successfully'
      };

    } catch (error) {
      console.error('Error rejecting application:', error);
      
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        console.warn('Authentication error, redirecting to signin');
        window.location.href = '/admin/signin';
        return {
          success: false,
          error: 'Please sign in again',
          authError: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to reject application',
        status: error.status
      };
    }
  }

  /**
   * Get application details by ID
   * @param {number} applicationId - ID of the application
   * @returns {Promise<Object>} Response with application details
   */
  static async getApplicationDetails(applicationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/${applicationId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim()) {
          data = JSON.parse(text);
        } else {
          data = null;
        }
      } else {
        data = null;
      }
      
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('Error fetching application details:', error);
      
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        console.warn('Authentication error, redirecting to signin');
        window.location.href = '/admin/signin';
        return {
          success: false,
          error: 'Please sign in again',
          authError: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to fetch application details',
        status: error.status
      };
    }
  }

  /**
   * Get applications statistics
   * @returns {Promise<Object>} Response with statistics data
   */
  static async getApplicationsStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim()) {
          data = JSON.parse(text);
        } else {
          data = { total: 0, pending: 0, approved: 0, rejected: 0 };
        }
      } else {
        data = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('Error fetching applications stats:', error);
      
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        console.warn('Authentication error, redirecting to signin');
        window.location.href = '/admin/signin';
        return {
          success: false,
          error: 'Please sign in again',
          authError: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        status: error.status
      };
    }
  }
}

/**
 * Default export for convenience
 */
export default AdminDashboardAPI;