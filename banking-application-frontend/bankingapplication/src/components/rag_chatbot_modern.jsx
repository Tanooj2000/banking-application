import React, { useState, useRef, useEffect } from 'react';
import './rag_chatbot.css';
import { sendRagChatMessage } from '../api/rag_chatbotApi';
import { AuthGuard } from '../utils/authGuard';

/** Categorised suggestion chips */
const SUGGESTION_CATEGORIES = [
  { id: 'user',     label: '👤 User',     icon: '👤' },
  { id: 'admin',    label: '🛡️ Admin',    icon: '🛡️' },
  { id: 'accounts', label: '🏦 Accounts', icon: '🏦' },
  { id: 'banks',    label: '🌐 Banks',    icon: '🌐' },
];

const CATEGORY_QUESTIONS = {
  user: [
    { label: 'View my profile',           question: 'Show my profile details.' },
    { label: 'Update my username',        question: 'I want to update my username.' },
    { label: 'Update my email',           question: 'I want to update my email.' },
    { label: 'Update my phone',           question: 'I want to update my phone number.' },
    { label: 'Change my password',        question: 'I want to change my password.' },
    { label: 'How do I sign up?',         question: 'How do I sign up on InterBankHub?' },
    { label: 'How do I log in?',          question: 'How do I log in to my account?' },
    { label: 'Forgot my password',        question: 'I forgot my password. How do I reset it?' },
    { label: 'Account locked',            question: 'My account is locked. What should I do?' },
    { label: 'Is my data safe?',          question: 'Is my data safe on InterBankHub?' },
  ],
  admin: [
    { label: 'View admin profile',        question: 'Show my admin profile.' },
    { label: 'Update bank name',          question: 'I want to update my bank name.' },
    { label: 'Update country',            question: 'I want to update my admin country.' },
    { label: 'Update admin email',        question: 'I want to update my admin email.' },
    { label: 'Change admin password',     question: 'I want to change my admin password.' },
    { label: 'What can admins do?',       question: 'What can a bank admin do on InterBankHub?' },
    { label: 'How to manage accounts?',   question: 'How does an admin manage user accounts?' },
    { label: 'How to approve accounts?',  question: 'How does an admin approve a bank account application?' },
    { label: 'Admin contact support',     question: 'How do I contact support as an admin?' },
  ],
  accounts: [
    { label: 'List my accounts',          question: 'Show all my accounts.' },
    { label: 'Account status',            question: 'What is my account status?' },
    { label: 'Application status',        question: 'What is my application status?' },
    { label: 'Open a new account',        question: 'How do I open a new bank account?' },
    { label: 'Account types available',   question: 'What are the account types available?' },
    { label: 'Required documents',        question: 'What documents are required for account creation?' },
    { label: 'How long does it take?',    question: 'How long does account creation take?' },
    { label: 'Savings vs Current',        question: 'What is the difference between savings and current account?' },
    { label: 'Countries supported',       question: 'Which countries are supported?' },
  ],
  banks: [
    { label: 'All available banks',       question: 'Show me all available banks.' },
    { label: 'Banks in India',            question: 'Show banks available in India.' },
    { label: 'Banks in USA',              question: 'Show banks available in USA.' },
    { label: 'Banks in UK',              question: 'Show banks available in UK.' },
    { label: 'Banks in Hyderabad',        question: 'Show banks available in Hyderabad.' },
    { label: 'What is InterBankHub?',     question: 'What is InterBankHub?' },
    { label: 'Banks by country',          question: 'How are banks organised by country on InterBankHub?' },
    { label: 'How to choose a bank?',     question: 'How do I choose the right bank on InterBankHub?' },
  ],
};

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
  const [showSuggestions, setShowSuggestions]   = useState(true);
  const [activeCategory, setActiveCategory]     = useState(null); // null = show categories
  // revealMap: { [msgId]: revealedCharCount } — drives typewriter animation
  const [revealMap, setRevealMap] = useState({ 0: Infinity });
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const revealTimerRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typewriter animation: reveal the latest bot message progressively
  useEffect(() => {
    const lastBot = [...messages].reverse().find(m => m.type === 'bot' && !m.isError);
    if (!lastBot) return;
    const full = lastBot.text || '';
    if ((revealMap[lastBot.id] ?? 0) >= full.length) return;

    clearInterval(revealTimerRef.current);
    const chunkSize = Math.max(2, Math.ceil(full.length / 60)); // finish in ~60 steps
    revealTimerRef.current = setInterval(() => {
      setRevealMap(prev => {
        const current = prev[lastBot.id] ?? 0;
        const next = Math.min(current + chunkSize, full.length);
        if (next >= full.length) clearInterval(revealTimerRef.current);
        return { ...prev, [lastBot.id]: next };
      });
    }, 18); // ~18 ms per step ≈ smooth 55 fps

    return () => clearInterval(revealTimerRef.current);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Get the user type: 'user' or 'admin'. */
  const getUserType = () => {
    return localStorage.getItem('userType') || sessionStorage.getItem('userType') || null;
  };

  /** Get the logged-in user's ID — handles both regular users and admins. */
  const getLoggedInUserId = () => {
    const userType = getUserType();
    if (userType === 'admin') {
      const adminData = AuthGuard.getAdminData?.() || null;
      return (
        adminData?.id ||
        adminData?.adminId ||
        sessionStorage.getItem('adminId') ||
        null
      );
    }
    const user = AuthGuard.getCurrentUser?.() || null;
    return (
      user?.userId ||
      user?.id ||
      user?.user_id ||
      localStorage.getItem('userId') ||
      null
    );
  };

  const getAuthToken = () => {
    const userType = getUserType();
    if (userType === 'admin') {
      return sessionStorage.getItem('userToken') || null;
    }
    return AuthGuard.getToken?.() || localStorage.getItem('authToken') || null;
  };

  const appendMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
    // Pre-seed reveal counter: user messages appear instantly; bot messages animate
    if (msg.type === 'bot' && !msg.isError) {
      setRevealMap((prev) => ({ ...prev, [msg.id]: 0 }));
    } else {
      setRevealMap((prev) => ({ ...prev, [msg.id]: Infinity }));
    }
  };

  /** Toggle category drill-down. */
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  /** Called when user clicks a sub-question chip. */
  const handleSubQuestionClick = (question) => {
    setShowSuggestions(false);
    setActiveCategory(null);
    sendMessage(question);
  };

  /** Re-open the suggestions panel. */
  const handleToggleSuggestions = () => {
    setShowSuggestions((prev) => !prev);
    if (!showSuggestions) setActiveCategory(null);
  };

  /** Core send function — used by text input and option buttons. */
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setShowSuggestions(false);
    setActiveCategory(null);

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
      const authToken = getAuthToken();
      const userType = getUserType();
      const result = await sendRagChatMessage({
        message:  text.trim(),
        userId:   userId || undefined,
        sessionId: sessionId || undefined,
        authToken: authToken || undefined,
        userType:  userType || undefined,
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
        text: err?.message || 'Sorry, I could not reach the chatbot service. Please try again.',
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
    <div className="rag-chatbot-container rag-chatbot-modern" role="dialog" aria-label="Banking Assistant chat">
      {/* Header */}
      <div className="rag-chatbot-header">
        <div className="rag-chatbot-title-wrap">
          <span className="rag-chatbot-title">Banking Assistant</span>
          <span className="rag-chatbot-subtitle">Secure support for your account questions</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rag-chatbot-close"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="rag-messages-area">
        {messages.map((msg) => {
          const revealed = revealMap[msg.id] ?? Infinity;
          const displayText = msg.type === 'bot' && !msg.isError
            ? msg.text?.slice(0, revealed) ?? ''
            : msg.text ?? '';
          const isTyping = msg.type === 'bot' && !msg.isError && revealed < (msg.text?.length ?? 0);

          return (
          <div key={msg.id} className={`rag-message ${msg.type} ${msg.isError ? 'error' : ''}`}>
            <div className="rag-message-bubble">
              {msg.responseType === 'auth_required' ? (
                // Render auth_required as structured component
                <div className="auth-required-message">
                  <div className="auth-title">Sign In Required</div>
                  <div className="auth-description">{msg.text || 'You need to be signed in to continue.'}</div>
                  <div className="auth-actions">
                    <div className="auth-action">
                      → Already have an account? <a href="/signin" className="chatbot-link">Sign In</a>
                    </div>
                    <div className="auth-action">
                      → New here? <a href="/signup" className="chatbot-link">Sign Up</a>
                    </div>
                  </div>
                </div>
              ) : (
                // Render text — typewriter for bot, instant for user
                <span className="rag-message-text">
                  {displayText}
                  {isTyping && <span className="rag-cursor" aria-hidden="true">▍</span>}
                </span>
              )}

              {/* Render clickable option buttons for selection_required — only after fully revealed */}
              {msg.responseType === 'selection_required' && msg.options?.length > 0 && !isTyping && (
                <div className="rag-options-list">
                  {msg.options.map((opt, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleOptionClick({ label: String(idx + 1), ...opt })}
                      disabled={isLoading}
                      className="rag-option-button"
                    >
                      {idx + 1}. {opt.label || opt.bankName || opt.accountId || JSON.stringify(opt)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="rag-message-meta">
              {msg.type === 'user' ? 'You' : 'Assistant'} · {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
          );
        })}

        {isLoading && (
          <div className="rag-message bot">
            <div className="rag-message-bubble rag-typing-indicator">
              <span className="typing-dot" style={dotStyle(0)} />
              <span className="typing-dot" style={dotStyle(0.2)} />
              <span className="typing-dot" style={dotStyle(0.4)} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Categorised suggestion chips */}
      {showSuggestions && (
        <div className="rag-suggestions-section" aria-label="Suggested questions">
          {/* Category row */}
          <div className="rag-suggestions-categories">
            {SUGGESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`rag-cat-chip${activeCategory === cat.id ? ' rag-cat-chip--active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
                disabled={isLoading}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sub-questions for the selected category */}
          {activeCategory && CATEGORY_QUESTIONS[activeCategory] && (
            <div className="rag-sub-questions" key={activeCategory}>
              {CATEGORY_QUESTIONS[activeCategory].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="rag-sub-chip"
                  onClick={() => handleSubQuestionClick(item.question)}
                  disabled={isLoading}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="rag-input-area">
        {/* Re-open suggestions toggle */}
        <button
          type="button"
          className={`rag-suggestions-toggle${showSuggestions ? ' rag-suggestions-toggle--active' : ''}`}
          onClick={handleToggleSuggestions}
          title={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
          aria-label="Toggle suggestions"
        >
          💡
        </button>
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message...."
          disabled={isLoading}
          rows={1}
          className="rag-message-input"
        />
        <button
          type="button"
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
  animationDelay: `${delay}s`,
});

export default RagChatbotModern;
