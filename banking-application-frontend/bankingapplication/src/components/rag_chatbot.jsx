import React, { useState, useRef } from 'react';
import './rag_chatbot.css';
import { sendRagChatMessage } from '../api/rag_chatbotApi';

const RagChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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

  return (
    <div className="rag-chatbot-container">
      <div className="rag-messages-area">
        {messages.map(msg => (
          <div key={msg.id} className={`rag-message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
            <div className="rag-message-bubble">
              <span>{msg.text}</span>
            </div>
            <div className="rag-message-meta">
              {msg.sender === 'user' ? 'You' : 'Bot'} · {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="rag-message bot">
            <div className="rag-message-bubble">
              <span>...</span>
            </div>
            <div className="rag-message-meta">Bot</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="rag-input-area">
        <textarea
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={1}
          className="rag-message-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="rag-send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default RagChatbot;
