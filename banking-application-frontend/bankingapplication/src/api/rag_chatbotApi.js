// RAG Chatbot API integration for Spring Boot chatbot-service (port 8086)
const CHATBOT_URL = 'http://localhost:8086/api/v1/chatbot/chat';

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
  if (userId)            body.userId            = userId;
  if (sessionId)         body.sessionId         = sessionId;
  if (selectedAccountId) body.selectedAccountId = selectedAccountId;
  if (modelName)         body.modelName         = modelName;

  const res = await fetch(CHATBOT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chatbot service error: ${res.status}`);
  }

  const json = await res.json();
  // Spring Boot wraps everything in { success, data: { response, responseType, sessionId, options, ... } }
  const data = json.data || json;
  return {
    response:     data.response     || data.reply || '',
    responseType: data.responseType || 'final_answer',
    sessionId:    data.sessionId    || null,
    options:      data.options      || null,
  };
}
