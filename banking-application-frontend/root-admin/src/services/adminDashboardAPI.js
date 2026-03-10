// Admin Dashboard API service
const API_BASE_URL = 'http://localhost:8083';

/**
 * Admin Dashboard API Service for managing applications
 */
export class AdminDashboardAPI {
  
  /**
   * Get authentication headers with token
   * @returns {Object} Headers object with authorization
   */
  static getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch all pending applications
   * @returns {Promise<Object>} Response with applications data
   */
  static async getPendingApplications() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/pending`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('Error fetching pending applications:', error);
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
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          rootUsername: "rootadmin",
          rootPassword: "rootpass",
          reason: reason
        }),
      });

      if (!response.ok) {
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
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          rootUsername: "rootadmin",
          rootPassword: "rootpass",
          reason: reason
        }),
      });

      if (!response.ok) {
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
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('Error fetching application details:', error);
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
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('Error fetching applications stats:', error);
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