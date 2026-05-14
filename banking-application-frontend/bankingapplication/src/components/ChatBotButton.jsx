import React, { useState } from 'react';
import './ChatBotButton.css';
import ChatBot from './ChatBot';
import robotIcon from '../assets/robot.png';

const ChatBotButton = ({ userId }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chatbot-fab ${isChatOpen ? 'active' : ''}`}
        onClick={handleToggleChat}
        aria-label="Open Banking Assistant"
        title="Chat with Banking Assistant"
      >
        {isChatOpen ? (
          <span className="fab-icon close">✕</span>
        ) : (
          <img src={robotIcon} alt="Robot" className="fab-icon robot" />
        )}
      </button>

      {/* Chat Component */}
      <ChatBot 
        isOpen={isChatOpen} 
        onClose={handleCloseChat} 
        userId={userId}
      />
    </>
  );
};

export default ChatBotButton;