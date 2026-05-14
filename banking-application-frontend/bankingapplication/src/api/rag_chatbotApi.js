// RAG Chatbot API integration for Spring Boot chatbot-service (port 8086)
const CHATBOT_URL = 'http://localhost:8086/chat';

/**
 * Send a message to the Spring Boot chatbot-service.
 *
 * @param {object} payload
 * @param {string}  payload.message            - The user's text input
 * @param {string} [payload.userId]            - Authenticated user ID (optional)
 * @param {string} [payload.sessionId]         - Session ID for multi-turn flows (optional)
 * @param {string} [payload.selectedAccountId] - Pre-selected account ID (optional)
 * @param {string} [payload.modelName]         - LLM model override (optional)
 * @param {string} [payload.authToken]         - User JWT for authenticated profile APIs (optional)
 * @param {string} [payload.userType]          - 'user' or 'admin', used for routing on the backend (optional)
 *
 * @returns {Promise<{response: string, responseType: string, sessionId: string|null, options: Array|null}>}
 */
export async function sendRagChatMessage({ message, userId, sessionId, selectedAccountId, modelName, authToken, userType }) {
  const body = { message };
  if (userId)            body.user_id             = userId;
  if (sessionId)         body.session_id          = sessionId;
  if (selectedAccountId) body.selected_account_id = selectedAccountId;
  if (modelName)         body.model_name          = modelName;
  if (authToken)         body.auth_token          = authToken;
  if (userType)          body.user_type           = userType;

  const res = await fetch(CHATBOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errJson = await res.json();
        detail = errJson?.detail || errJson?.message || JSON.stringify(errJson);
      } else {
        detail = await res.text();
      }
    } catch {
      detail = '';
    }
    throw new Error(`Chatbot service error ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const json = await res.json();
  const data = json.data || json;
  return {
    response:     data.response      || '',
    responseType: data.response_type || 'final_answer',
    sessionId:    data.session_id    || null,
    options:      data.options       || null,
  };
}
