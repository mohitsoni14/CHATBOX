import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Send, Camera, Mic, Paperclip, Smile, Bot } from 'lucide-react';
import ChatbotOverlay from './ChatbotOverlay';

interface InputAreaProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'file') => void;
  onOpenChatbot: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onOpenChatbot }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Send button ripple effect
      gsap.to(sendButtonRef.current, {
        scale: 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleButtonHover = (element: HTMLButtonElement) => {
    gsap.to(element, {
      scale: 1.1,
      duration: 0.2,
      ease: 'power2.out'
    });
  };

  const handleButtonLeave = (element: HTMLButtonElement) => {
    gsap.to(element, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    });
  };

  return (
    <div className="input-area glass-effect">
      <div className="input-container">
        <div className="media-buttons">
          <button
            className="media-btn"
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
          >
            <Paperclip size={20} />
          </button>
          <button
            className="media-btn"
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
          >
            <Camera size={20} />
          </button>
          <button
            className="media-btn"
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
          >
            <Mic size={20} />
          </button>
        </div>

        <div className={`input-wrapper ${isFocused ? 'focused' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your message..."
            className="message-input"
          />
          <div className="flex items-center">
            <button
              className="emoji-btn"
              onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
              onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
            >
              <Smile size={20} />
            </button>
            <button
              className="ai-btn ml-2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={onOpenChatbot}
              onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
              onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
              title="AI Assistant"
            >
              <Bot size={20} className="text-blue-500 dark:text-blue-400" />
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button
            ref={sendButtonRef}
            onClick={handleSend}
            disabled={!message.trim()}
            className={`send-btn ${message.trim() ? 'active' : ''}`}
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default InputArea;