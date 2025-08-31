import React, { useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerComponentProps {
  onEmojiClick: (emoji: string) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({
  onEmojiClick,
  onClose,
  position = { top: 0, left: 0 }
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji);
  };

  const pickerStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1000,
    ...position,
    transform: 'translateY(-100%)',
    marginTop: '-10px'
  };

  return (
    <div ref={pickerRef} style={pickerStyle}>
      <EmojiPicker 
        onEmojiClick={handleEmojiClick} 
        width={300}
        height={350}
        previewConfig={{
          showPreview: false
        }}
      />
    </div>
  );
};

export default EmojiPickerComponent;
