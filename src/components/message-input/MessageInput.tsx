import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  onEmojiClick?: () => void;
  onFileClick?: () => void;
  onCameraClick?: () => void;
  onVoiceClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  onEmojiClick,
  onFileClick,
  onCameraClick,
  onVoiceClick,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={`message-input-container ${isFocused ? 'focused' : ''}`}>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="message-input"
        />
        <div className="input-actions">
          {onEmojiClick && (
            <button 
              type="button" 
              onClick={onEmojiClick}
              className="action-button"
              aria-label="Emoji"
            >
              😊
            </button>
          )}
        </div>
      </div>
      <div className="action-buttons">
        {onCameraClick && (
          <button 
            type="button" 
            onClick={onCameraClick}
            className="action-button"
            aria-label="Camera"
          >
            📷
          </button>
        )}
        {onFileClick && (
          <button 
            type="button" 
            onClick={onFileClick}
            className="action-button"
            aria-label="Attach file"
          >
            📎
          </button>
        )}
        {onVoiceClick && (
          <button 
            type="button" 
            onClick={onVoiceClick}
            className="action-button"
            aria-label="Voice message"
          >
            🎤
          </button>
        )}
        <button 
          type="button" 
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="send-button"
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
