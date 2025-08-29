import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Send, Camera, Mic, Paperclip, Smile, Bot, X } from 'lucide-react';
import ChatbotOverlay from './ChatbotOverlay';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface InputAreaProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'file') => void;
  onOpenChatbot: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onOpenChatbot }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = message;
      const newText = text.substring(0, start) + emojiData.emoji + text.substring(end);
      setMessage(newText);
      
      // Set cursor position after the inserted emoji
      const newPosition = start + emojiData.emoji.length;
      setTimeout(() => {
        input.selectionStart = newPosition;
        input.selectionEnd = newPosition;
        input.focus();
      }, 0);
    }
  };

  const toggleEmojiPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEmojiPicker(prev => !prev);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                className={`emoji-btn ${showEmojiPicker ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                onClick={toggleEmojiPicker}
                onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
                onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
              >
                {showEmojiPicker ? <X size={20} /> : <Smile size={20} />}
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    autoFocusSearch={false}
                    width={300}
                    height={350}
                    previewConfig={{
                      showPreview: false
                    }}
                    searchDisabled={false}
                    skinTonesDisabled
                  />
                </div>
              )}
            </div>
            <button
              className="ai-btn ml-2 p-1.5 rounded-full bg-black hover:bg-gray-800 transition-colors"
              onClick={onOpenChatbot}
              onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
              onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
              title="AI Assistant"
            >
              <Bot size={20} className="text-white" />
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