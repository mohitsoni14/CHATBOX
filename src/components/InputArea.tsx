import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Mic, Paperclip, Smile, Bot, Send, Play, Pause } from 'lucide-react';
import ChatbotOverlay from './ChatbotOverlay';
import CameraInterface from './camera/CameraInterface';
import EmojiPickerComponent from './emoji/EmojiPickerComponent';
import FileUploadComponent from './file-upload/FileUploadComponent';

interface MessageData {
  id: string;
  text: string;
  sender: string;
  senderName?: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileData?: any;
  fileDataObj?: {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    data: File;
  };
  isStored?: boolean;
  isBotTyping?: boolean;
  duration?: number;
  isAudio?: boolean; // Flag to identify audio messages // Duration in seconds for audio messages
}

interface InputAreaProps {
  onSendMessage: (message: MessageData) => void;
  onOpenChatbot: () => void;
  isConnected?: boolean;
}

const storeImageData = (id: string, dataUrl: string) => {
  try {
    const storedImages = JSON.parse(localStorage.getItem('chatImages') || '[]');
    const newImage = { id, dataUrl };
    const recentImages = [...storedImages, newImage].slice(-50);
    localStorage.setItem('chatImages', JSON.stringify(recentImages));
  } catch (error) {
    console.error('Error storing image data:', error);
  }
};

const storeMediaData = (id: string, dataUrl: string, type: 'image' | 'audio' = 'image') => {
  try {
    const storageKey = type === 'image' ? 'chatImages' : 'chatAudios';
    const storedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Remove any existing entry with this ID
    const filteredItems = storedItems.filter((item: any) => item.id !== id);
    
    // For audio, ensure we have a proper data URL
    let dataToStore = dataUrl;
    if (type === 'audio') {
      // If it's already a data URL, use it as is
      if (!dataUrl.startsWith('data:')) {
        dataToStore = `data:audio/wav;base64,${dataUrl}`;
      } else if (!dataUrl.startsWith('data:audio/')) {
        // If it's a data URL but not audio, fix the MIME type
        const base64Data = dataUrl.split(',')[1] || dataUrl;
        dataToStore = `data:audio/wav;base64,${base64Data}`;
      }
    }
    
    // Add new entry at the beginning of the array (most recent first)
    filteredItems.unshift({ id, dataUrl: dataToStore });
    
    // Store only the 10 most recent items to prevent localStorage overflow
    const itemsToStore = filteredItems.slice(0, 10);
    
    localStorage.setItem(storageKey, JSON.stringify(itemsToStore));
    return true;
  } catch (error) {
    console.error(`Error storing ${type} data:`, error);
    return false;
  }
};

const getStoredMedia = (id: string, type: 'image' | 'audio' = 'image'): string | null => {
  try {
    const storageKey = type === 'image' ? 'chatImages' : 'chatAudios';
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return null;
    
    const storedItems = JSON.parse(storedData);
    if (!Array.isArray(storedItems)) return null;
    
    const item = storedItems.find((item: any) => item?.id === id);
    if (!item?.dataUrl) return null;
    
    // Ensure audio URLs have the correct MIME type
    if (type === 'audio') {
      // If it's already a proper audio data URL, return as is
      if (item.dataUrl.startsWith('data:audio/')) {
        return item.dataUrl;
      }
      
      // If it's a base64 string without the data URL prefix, add it
      if (!item.dataUrl.startsWith('data:')) {
        return `data:audio/wav;base64,${item.dataUrl}`;
      }
      
      // If it's a data URL but not audio, fix the MIME type
      const base64Data = item.dataUrl.split(',')[1] || item.dataUrl;
      return `data:audio/wav;base64,${base64Data}`;
    }
    
    return item.dataUrl;
  } catch (error) {
    console.error(`Error getting stored ${type}:`, error);
    return null;
  }
};

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onOpenChatbot,
  isConnected = true
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // Check if mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageCapture = useCallback(async (data: { url: string, blob: Blob, dataUrl: string }) => {
    const messageId = Date.now().toString();
    storeImageData(messageId, data.dataUrl);
    
    onSendMessage({
      id: messageId,
      text: data.dataUrl,
      sender: 'user',
      timestamp: new Date(),
      type: 'image',
      fileData: data.blob,
      isStored: true,
      fileType: 'image/jpeg'
    });
    
    setShowCamera(false);
  }, [onSendMessage]);
  
  const handleFileSelect = useCallback((file: File) => {
    const messageId = Date.now().toString();
    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.result) {
        const base64Data = reader.result.toString();
        
        if (file.type.startsWith('image/')) {
          storeImageData(messageId, base64Data);
          
          onSendMessage({
            id: messageId,
            text: base64Data,
            sender: 'user',
            timestamp: new Date(),
            type: 'image',
            fileData: file,
            isStored: true,
            fileType: file.type,
            fileName: file.name,
            fileSize: file.size
          });
        } else {
          onSendMessage({
            id: messageId,
            text: file.name,
            sender: 'user',
            timestamp: new Date(),
            type: 'file',
            fileData: file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          });
        }
      }
    };
    
    reader.readAsDataURL(file);
  }, [onSendMessage]);
  
  const handleEmojiClick = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  const handleCameraClick = useCallback(() => {
    setShowCamera(true);  
  }, []);
  
  const handleEmojiButtonClick = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVoiceClick = useCallback(async () => {
    try {
      if (isRecording) {
        // Stop recording
        if (mediaRecorder) {
          mediaRecorder.stop();
          setIsRecording(false);
          setIsPaused(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        }
        return;
      }

      // Start new recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      let startTime = 0;

      newMediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      newMediaRecorder.onstop = async () => {
        const recordingDuration = Math.ceil((Date.now() - startTime) / 1000);
        
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const messageId = Date.now().toString();
          
          // Convert blob to base64 for storage
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = () => {
            try {
              const base64data = reader.result as string;
              
              // Store the audio data with proper MIME type
              storeMediaData(messageId, base64data, 'audio');
              
              // Send the audio message with the actual recording duration
              onSendMessage({
                id: messageId,
                text: 'audio-message',
                sender: 'user',
                timestamp: new Date(),
                type: 'file',
                fileData: audioBlob,
                fileName: `voice-message-${messageId}.webm`,
                fileType: 'audio/webm',
                fileSize: audioBlob.size,
                duration: Math.max(1, recordingDuration), // Ensure at least 1 second
                isAudio: true
              });
            } catch (error) {
              console.error('Error handling audio data:', error);
            }
          };
        }

        // Clean up
        setAudioChunks([]);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        stream.getTracks().forEach(track => track.stop());
      };

      // Set start time when recording actually starts
      newMediaRecorder.onstart = () => {
        startTime = Date.now();
      };

      // Start recording with timeslice to get more accurate duration
      newMediaRecorder.start(100); // Request data every 100ms for more accurate duration
      setMediaRecorder(newMediaRecorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setIsPaused(false);
      
      // Start UI timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  }, [isRecording, mediaRecorder, onSendMessage]);

  const handlePauseResume = useCallback(() => {
    if (!mediaRecorder) return;
    
    if (isPaused) {
      mediaRecorder.resume();
      // Restart timer if it was cleared
      if (!recordingTimerRef.current) {
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      }
    } else {
      mediaRecorder.pause();
      // Pause timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    // Toggle pause state
    setIsPaused(!isPaused);
  }, [mediaRecorder, isPaused, recordingTime]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [mediaRecorder]);
  
  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      onSendMessage({
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      });
      setMessage('');
    }
  }, [message, onSendMessage]);

  // Handle click outside to close emoji picker
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (message.trim()) {
          handleSendMessage();
        }
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (input) {
        input.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [message, handleSendMessage]);

  return (
    <div className="input-area">
      <div className="input-container">
        <div className="media-buttons">
          <button 
            type="button" 
            onClick={handleCameraClick}
            className="media-btn"
            aria-label="Camera"
          >
            <Camera size={20} />
          </button>
          <FileUploadComponent
            onFileSelect={handleFileSelect}
            accept="*/*"
            multiple={false}
          >
            <button 
              type="button" 
              className="media-btn"
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </button>
          </FileUploadComponent>
        </div>
        
        <div className={`input-wrapper ${isFocused ? 'focused' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type a message..."
            className="message-input"
            disabled={!isConnected}
          />
          
          <button 
            type="button" 
            onClick={handleEmojiButtonClick}
            className="emoji-btn"
            aria-label="Emoji"
          >
            <Smile size={20} />
          </button>
          
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="emoji-picker-container">
              <EmojiPickerComponent
                onEmojiClick={handleEmojiClick}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
        
        <div className="action-buttons">
          {isRecording ? (
            <div className="recording-controls">
              <div className="recording-timer">
                <div className="pulse-dot"></div>
                <span>Recording {formatTime(recordingTime)}</span>
              </div>
              <div className="recording-actions">
                <button
                  type="button"
                  onClick={handlePauseResume}
                  className="control-btn"
                  aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                  title={isPaused ? 'Resume recording' : 'Pause recording'}
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className="control-btn stop-btn"
                  aria-label="Send recording"
                  title="Send recording"
                >
                  <Send size={16} />
                </button>
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="control-btn delete-btn"
                  aria-label="Cancel recording"
                  title="Cancel recording"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleVoiceClick}
              className="action-btn"
              aria-label="Record voice message"
              title="Record voice message"
            >
              <Mic size={20} />
            </button>
          )}
          
          <button
            type="button"
            onClick={onOpenChatbot}
            className={`ai-btn ${isConnected ? 'connected' : ''}`}
            aria-label={isConnected ? 'AI Assistant is connected' : 'AI Assistant is disconnected'}
            title={isConnected ? 'AI Assistant is connected' : 'AI Assistant is disconnected'}
          >
            <Bot size={20} />
          </button>
          
          <button
            type="button"
            onClick={handleSendMessage}
            className={`send-btn ${message.trim() ? 'active' : ''}`}
            disabled={!message.trim()}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button 
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                onClick={() => setShowCamera(false)}
                aria-label="Close camera"
              >
                <X size={24} />
              </button>
            </div>
            <div className="aspect-video w-full">
              <CameraInterface 
                onCapture={handleImageCapture}
                onClose={() => setShowCamera(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <ChatbotOverlay isOpen={false} onClose={onOpenChatbot} />
      
      <FileUploadComponent
        onFileSelect={handleFileSelect}
        accept="*/*"
        multiple={false}
      >
        <div id="file-upload" style={{ display: 'none' }} />
      </FileUploadComponent>
    </div>
  );
};

export default InputArea;
