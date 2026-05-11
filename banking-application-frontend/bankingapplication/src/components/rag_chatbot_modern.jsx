import React, { useState, useRef, useEffect } from 'react';
import './rag_chatbot.css';
import { sendRagChatMessage } from '../api/rag_chatbotApi';
import { AuthGuard } from '../utils/authGuard';

/**
 * Modern RAG Chatbot component.
 *
 * Handles three response types from the backend:
 *  - final_answer       → display text response normally
 *  - selection_required → display numbered option buttons; clicking one sends it back
 *  - auth_required      → prompt the user to log in
 */
const RagChatbotModern = ({ onClose }) => {
  const [messages, setMessages]   = useState([
    {
      id: 0,
      type: 'bot',
      text: 'Hi! I\'m your Banking Assistant. Ask me anything about your account or banking services.',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [sessionId, setSessionId]       = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Get the logged-in user's ID from localStorage (set by authGuard on login). */
  const getLoggedInUserId = () => {
    const user = AuthGuard.getCurrentUser?.() || null;
    return user?.userId || user?.id || null;
  };

  const appendMessage = (msg) => setMessages((prev) => [...prev, msg]);

  /** Core send function — used by text input and option buttons. */
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Show the user's message in the chat
    appendMessage({
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
    });

    setIsLoading(true);
    try {
      const userId = getLoggedInUserId();
      const result = await sendRagChatMessage({
        message:  text.trim(),
        userId:   userId || undefined,
        sessionId: sessionId || undefined,
      });

      // Persist session ID for multi-turn flows (account selection, etc.)
      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      if (result.responseType === 'auth_required') {
        appendMessage({
          id: Date.now() + 1,
          type: 'bot',
          text: result.response || 'Please log in to view your account details.',
          responseType: 'auth_required',
          timestamp: new Date(),
        });
      } else if (result.responseType === 'selection_required' && result.options?.length) {
        appendMessage({
          id: Date.now() + 1,
          type: 'bot',
          text: result.response,
          responseType: 'selection_required',
          options: result.options,
          timestamp: new Date(),
        });
      } else {
        // final_answer or any other type
        appendMessage({
          id: Date.now() + 1,
          type: 'bot',
          text: result.response,
          responseType: 'final_answer',
          timestamp: new Date(),
        });
      }
    } catch (err) {
      appendMessage({
        id: Date.now() + 2,
        type: 'bot',
        text: 'Sorry, I could not reach the chatbot service. Please try again.',
        isError: true,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text || isLoading) return;
    setInputMessage('');
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** Called when user clicks one of the selection option buttons. */
  const handleOptionClick = (option) => {
    // Send the option label (or index string) as the next message
    const choice = option.label || String(option.index ?? option);
    sendMessage(choice);
  };

  return (
    <div className="rag-chatbot-container" style={{ width: 370, height: 520, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
        color: '#fff',
        padding: '14px 18px',
        fontWeight: 700,
        fontSize: '1.08rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px 16px 0 0',
      }}>
        <span>🏦 Banking Assistant</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="rag-messages-area" style={{ flex: 1, overflowY: 'auto' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`rag-message ${msg.type} ${msg.isError ? 'error' : ''}`}>
            <div className="rag-message-bubble">
              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>

              {/* Render clickable option buttons for selection_required */}
              {msg.responseType === 'selection_required' && msg.options?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick({ label: String(idx + 1), ...opt })}
                      disabled={isLoading}
                      style={{
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {idx + 1}. {opt.label || opt.bankName || opt.accountId || JSON.stringify(opt)}
                    </button>
                  ))}
                </div>
              )}

              {/* Auth required hint */}
              {msg.responseType === 'auth_required' && (
                <div style={{ marginTop: 8, color: '#6366f1', fontWeight: 600, fontSize: '0.9rem' }}>
                  Please log in to continue.
                </div>
              )}
            </div>
            <div className="rag-message-meta">
              {msg.type === 'user' ? 'You' : 'Assistant'} · {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="rag-message bot">
            <div className="rag-message-bubble" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span className="typing-dot" style={dotStyle(0)} />
              <span className="typing-dot" style={dotStyle(0.2)} />
              <span className="typing-dot" style={dotStyle(0.4)} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="rag-input-area">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or pick an option above…"
          disabled={isLoading}
          rows={1}
          className="rag-message-input"
          style={{ resize: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!inputMessage.trim() || isLoading}
          className="rag-send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

const dotStyle = (delay) => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#94a3b8',
  animation: `bounce 1s ${delay}s infinite`,
});

export default RagChatbotModern;
