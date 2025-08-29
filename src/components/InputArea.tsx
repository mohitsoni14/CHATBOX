import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Send, Camera, Mic, Paperclip, Smile, Bot, X } from 'lucide-react';
import ChatbotOverlay from './ChatbotOverlay';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface InputAreaProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'file') => void;
  onOpenChatbot: () => void;
  isConnected?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onOpenChatbot, isConnected = true }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (message.trim() && isConnected) {
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
          <div className="relative flex items-center gap-1">
            <div ref={emojiPickerRef} className="relative">
              <button
                type="button"
                className={`p-2 ${isConnected ? 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400' : 'text-gray-400 dark:text-gray-500'} transition-colors`}
                onClick={toggleEmojiPicker}
                onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
                onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
                disabled={!isConnected}
                aria-label="Toggle emoji picker"
              >
                {showEmojiPicker ? <X size={20} /> : <Smile size={20} />}
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 right-0 transform z-50">
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
              onClick={onOpenChatbot}
              onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
              onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
              className="p-1 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="AI Assistant"
            >
              <Bot size={20} />
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button
            ref={sendButtonRef}
            onClick={handleSend}
            disabled={!isConnected}
            className={`p-2 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isConnected ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500' : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'}`}
            aria-label={isConnected ? "Send message" : "Connecting to chat"}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default InputArea;