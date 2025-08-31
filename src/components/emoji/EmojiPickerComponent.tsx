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

  return (
    <div ref={pickerRef} className="emoji-picker-wrapper">
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
    />
    </div>
  );
};

export default EmojiPickerComponent;
