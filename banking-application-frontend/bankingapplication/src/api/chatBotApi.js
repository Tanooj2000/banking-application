import axios from 'axios';

// Base URL for the chatbot microservice
const CHATBOT_BASE_URL = 'http://localhost:8086/api/v1/chatbot';

// Create axios instance with default config
const chatBotApi = axios.create({
  baseURL: CHATBOT_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token if available
chatBotApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
chatBotApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('ChatBot API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The chatbot is taking longer than expected to respond.');
    }
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          throw new Error('Authentication required. Please log in to use the chatbot.');
        case 403:
          throw new Error('You do not have permission to use this service.');
        case 404:
          throw new Error('ChatBot service is not available at the moment.');
        case 500:
          throw new Error(data?.errorMessage || 'Internal server error. Please try again later.');
        default:
          throw new Error(data?.errorMessage || `Server error: ${status}`);
      }
    }
    
    if (error.request) {
      // Request made but no response received
      throw new Error('ChatBot service is not responding. Please check your connection and try again.');
    }
    
    // Something else happened
    throw new Error('An unexpected error occurred. Please try again.');
  }
);

/**
 * Send a chat message to the chatbot
 * @param {Object} params - Chat parameters
 * @param {string} params.message - The user's message
 * @param {string} params.userId - User ID
 * @param {string} [params.sessionId] - Session ID (optional, will be generated if not provided)
 * @param {string} [params.context] - Additional context for banking queries
 * @param {string} [params.authToken] - JWT authentication token for secured API calls
 * @returns {Promise<Object>} Chat response from the bot
 */
export const sendChatMessage = async ({ message, userId, sessionId = null, context = null, authToken = null }) => {
  try {
    const requestData = {
      message: message.trim(),
      userId,
      sessionId,
      context,
      authToken, // Include JWT token in request body for backend processing
    };

    const response = await chatBotApi.post('/chat', requestData);
    
    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      throw new Error(response.data?.errorMessage || 'Failed to get response from chatbot');
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get chatbot health status
 * @returns {Promise<boolean>} Health status
 */
export const getChatBotHealth = async () => {
  try {
    const response = await chatBotApi.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('ChatBot health check failed:', error);
    return false;
  }
};

/**
 * Get chatbot capabilities
 * @returns {Promise<string>} Capabilities description
 */
export const getChatBotCapabilities = async () => {
  try {
    const response = await chatBotApi.get('/capabilities');
    return response.data;
  } catch (error) {
    console.error('Error getting chatbot capabilities:', error);
    throw error;
  }
};

/**
 * Utility function to generate a session ID
 * @returns {string} Generated session ID
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default {
  sendChatMessage,
  getChatBotHealth,
  getChatBotCapabilities,
  generateSessionId,
};