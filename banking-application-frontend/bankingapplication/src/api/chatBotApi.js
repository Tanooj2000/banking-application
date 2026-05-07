
/**
 * Send a message to the backend Spring Boot chatbot API.
 * @param {string} message - The user's message to the chatbot.
 * @returns {Promise<string>} - The chatbot's reply.
 */
export async function sendChatMessage(message) {
  try {
    const response = await fetch('http://localhost:8080/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error('Failed to get response from chatbot backend');
    }
    const data = await response.json();
    // Expecting backend to return { reply: "..." } or similar
    return data.reply || data.response || data.message || '';
  } catch (error) {
    console.error('ChatBot API Error:', error);
    throw error;
  }
}