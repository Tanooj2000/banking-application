import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
// import { sendChatMessage, getChatBotHealth, generateSessionId } from '../api/chatBotApi';
import robotImage from '../assets/robot.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBank,
  faMoneyBillWave,
  faChartLine,
  faPhone,
  faEnvelope,
  faLock,
  faCheck,
  faInfoCircle,
  faUser,
  faShieldAlt,
  faRobot,
  faMinus,
  faPlus,
  faTimes,
  faPaperPlane,
  faChevronDown,
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons';

// This component is deprecated. Please use RagChatbot instead.
const ChatBot = () => {
  return (
    <div style={{ padding: 32, color: 'red', textAlign: 'center' }}>
      <strong>This chatbot is disabled. Please use the new RAG Chatbot.</strong>
    </div>
  );
};

export default ChatBot;

  const handleQuickReply = (reply) => {
    // Handle both string format (legacy) and object format (new emoji format)
    const messageText = typeof reply === 'string' ? reply : reply.text;
    handleSendMessage(messageText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setQuickReplies([]);
    initializeChat();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen)
     return null;

  return (
    <div className="chatbot-overlay">
      <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
        
        {/* Modern Header */}
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
                      onLoad={() => console.log('Robot image loaded successfully')}
                      onError={(e) => {
                        console.error('Robot image failed to load:', robotImage);
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '🤖';
                      }}
                    />
                  ) : (
                    '🤖'
                  )}
                </div>
                <div className="status-pulse"></div>
              </div>
              <div className="bot-details">
                <h3 className="bot-name">SecureBot</h3>
                <div className="bot-status">
                  <span className="status-dot"></span>
                  <span className="status-text">{isServiceAvailable ? 'Available Now' : 'Offline'}</span>
                </div>
              </div>
            </div>
            
            <div className="header-actions">
              <button className="action-button" onClick={toggleMinimize} title={isMinimized ? 'Expand' : 'Minimize'}>
                <FontAwesomeIcon icon={isMinimized ? faChevronDown : faMinus} />
              </button>
              
              <button className="action-button" onClick={clearChat} title="New Chat">
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
                {messages.map((message, index) => (
                  <div key={message.id} className={`message-wrapper ${message.sender}`}>
                    <div className="message-content">
                      {message.sender === 'bot' && (
                        <div className="message-avatar">
                          {robotImage ? (
                            <img 
                              src={robotImage} 
                              alt="SecureBot" 
                              className="robot-image-small"
                              onLoad={() => console.log('Small robot image loaded')}
                              onError={(e) => {
                                console.error('Small robot image failed to load');
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '🤖';
                              }}
                            />
                          ) : (
                            '🤖'
                          )}
                        </div>
                      )}
                      
                      <div className="message-bubble">
                        <div className={`bubble-content ${message.isError ? 'error' : ''}`}>
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
                            onLoad={() => console.log('Loading robot image loaded')}
                            onError={(e) => {
                              console.error('Loading robot image failed to load');
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = '🤖';
                            }}
                          />
                        ) : (
                          '🤖'
                        )}
                      </div>
                      <div className="message-bubble">
                        <div className="bubble-content typing">
                          <div className="typing-animation">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Replies */}
            {quickReplies.length > 0 && !isLoading && (
              <div className="quick-replies-section">
                <div className="quick-replies-scroll">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(typeof reply === 'string' ? reply : reply.text)}
                      className="quick-reply"
                      disabled={!isServiceAvailable}
                    >

                      <span>{typeof reply === 'string' ? reply : reply.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="input-section">
              <div className="input-container">
                <div className="input-wrapper">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading || !isServiceAvailable}
                    rows={1}
                    className="message-input"
                  />
                  
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading || !isServiceAvailable}
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



export default ChatBot;