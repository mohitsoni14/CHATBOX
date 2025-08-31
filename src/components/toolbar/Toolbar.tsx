import React from 'react';
import { Camera, Mic, Paperclip, Smile, Bot } from 'lucide-react';

interface ToolbarProps {
  onCameraClick: () => void;
  onMicClick: () => void;
  onAttachmentClick: () => void;
  onEmojiClick: () => void;
  onBotClick: () => void;
  isConnected?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onCameraClick,
  onMicClick,
  onAttachmentClick,
  onEmojiClick,
  onBotClick,
  isConnected = true,
}) => {
  return (
    <div className="toolbar">
      <button
        type="button"
        onClick={onCameraClick}
        className="toolbar-button"
        aria-label="Take photo"
      >
        <Camera size={20} />
      </button>
      
      <button
        type="button"
        onClick={onAttachmentClick}
        className="toolbar-button"
        aria-label="Attach file"
      >
        <Paperclip size={20} />
      </button>
      
      <button
        type="button"
        onClick={onEmojiClick}
        className="toolbar-button"
        aria-label="Choose emoji"
      >
        <Smile size={20} />
      </button>
      
      <button
        type="button"
        onClick={onMicClick}
        className="toolbar-button"
        aria-label="Voice message"
      >
        <Mic size={20} />
      </button>
      
      <button
        type="button"
        onClick={onBotClick}
        className={`toolbar-button ${isConnected ? 'connected' : 'disconnected'}`}
        aria-label={isConnected ? 'AI Assistant is connected' : 'AI Assistant is disconnected'}
        title={isConnected ? 'AI Assistant is connected' : 'AI Assistant is disconnected'}
      >
        <Bot size={20} />
      </button>
    </div>
  );
};

export default Toolbar;
