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
 *
 * @returns {Promise<{response: string, responseType: string, sessionId: string|null, options: Array|null}>}
 */
export async function sendRagChatMessage({ message, userId, sessionId, selectedAccountId, modelName }) {
  const body = { message };
  if (userId)            body.user_id             = userId;
  if (sessionId)         body.session_id          = sessionId;
  if (selectedAccountId) body.selected_account_id = selectedAccountId;
  if (modelName)         body.model_name          = modelName;

  const res = await fetch(CHATBOT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chatbot service error: ${res.status}`);
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
