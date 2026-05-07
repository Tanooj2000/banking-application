import React, { useState, useRef } from 'react';
import './ChatBot.css';
import { sendRagChatMessage } from '../api/rag_chatbotApi';
import robotImage from '../assets/robot.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMinus,
  faPlus,
  faTimes,
  faPaperPlane,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';

const RagChatbotModern = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      text: "Hello! I'm SecureBot, your intelligent banking assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const reply = await sendRagChatMessage(userMessage.text);
      const botMessage = {
        id: Date.now() + 1,
        text: reply,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        text: 'Sorry, there was a problem contacting the chatbot.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: "Hello! I'm SecureBot, your intelligent banking assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  const handleMinimize = () => setIsMinimized(!isMinimized);

  // Scroll to bottom on new message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMinimized]);

  return (
    <div className="chatbot-overlay">
      <div className={`chatbot-container${isMinimized ? ' minimized' : ''}`}> 
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-content">
            <div className="bot-info">
              <div className="bot-avatar">
                <div className="avatar-icon">
                  {robotImage ? (
                    <img 
                      src={robotImage} 
                      alt="SecureBot" 
                      className="robot-image"
                      onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '🤖'; }}
                    />
                  ) : '🤖'}
                </div>
                <div className="status-pulse"></div>
              </div>
              <div className="bot-details">
                <h3 className="bot-name">SecureBot</h3>
                <div className="bot-status">
                  <span className="status-dot"></span>
                  <span className="status-text">Available Now</span>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button className="action-button" onClick={handleMinimize} title={isMinimized ? 'Expand' : 'Minimize'}>
                <FontAwesomeIcon icon={isMinimized ? faChevronDown : faMinus} />
              </button>
              <button className="action-button" onClick={handleClearChat} title="New Chat">
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button className="action-button close-button" onClick={onClose} title="Close">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </div>
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="messages-container">
              <div className="messages-scroll">
                {messages.map((message) => (
                  <div key={message.id} className={`message-wrapper ${message.sender}`}>
                    <div className="message-content">
                      {message.sender === 'bot' && (
                        <div className="message-avatar">
                          {robotImage ? (
                            <img 
                              src={robotImage} 
                              alt="SecureBot" 
                              className="robot-image-small"
                              onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '🤖'; }}
                            />
                          ) : '🤖'}
                        </div>
                      )}
                      <div className="message-bubble">
                        <div className={`bubble-content${message.isError ? ' error' : ''}`}>
                          <p className="message-text">{message.text}</p>
                          <span className="message-time">
                            {new Intl.DateTimeFormat('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }).format(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message-wrapper bot">
                    <div className="message-content">
                      <div className="message-avatar">
                        {robotImage ? (
                          <img 
                            src={robotImage} 
                            alt="SecureBot" 
                            className="robot-image-small"
                            onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '🤖'; }}
                          />
                        ) : '🤖'}
                      </div>
                      <div className="message-bubble">
                        <div className="bubble-content typing">
                          <div className="typing-animation">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* Input Area */}
            <div className="input-section">
              <div className="input-container">
                <div className="input-wrapper">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    rows={1}
                    className="message-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="send-button"
                    title="Send message"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </div>
              <div className="input-footer">
                <span className="powered-text">
                  Powered by <strong>SecureBank AI</strong>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RagChatbotModern;
