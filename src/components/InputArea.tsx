import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { Send, Camera, Mic, Paperclip, Smile, Bot } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'file') => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
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
          <button
            className="emoji-btn"
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
          >
            <Smile size={20} />
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="ai-btn"
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
          >
            <Bot size={20} />
          </button>
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