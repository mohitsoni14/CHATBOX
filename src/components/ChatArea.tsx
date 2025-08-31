import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Download, File, FileText, FileImage, FileVideo2, FileAudio, FileArchive, FileSpreadsheet, FileCode, Play, Pause } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderName?: string;
  timestamp: Date | number;
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
  duration?: number; // Duration in seconds for audio messages
  isAudio?: boolean; // Flag to identify audio messages
}

interface ChatAreaProps {
  messages: Message[];
  currentUser: string;
  username: string;
}

const ChatArea = ({ messages, currentUser, username }: ChatAreaProps): JSX.Element => {
  // Create a ref to store audio elements and their cleanup functions
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  const cleanupRefs = useRef<{[key: string]: () => void}>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  
  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Function to toggle audio playback
  const toggleAudioPlayback = useCallback(async (messageId: string) => {
    try {
      const audio = audioRefs.current[messageId];
      if (!audio) {
        console.warn('Audio element not found for message:', messageId);
        return;
      }
      
      // Get the current message from the ref
      const message = messagesRef.current.find(m => m.id === messageId);
      if (!message) {
        console.warn('Message not found:', messageId);
        return;
      }

      // Pause currently playing audio if different from the one being toggled
      if (playingAudioId && playingAudioId !== messageId) {
        const currentAudio = audioRefs.current[playingAudioId];
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      if (audio.paused) {
        try {
          // Get the audio data from storage
          const audioSrc = getStoredMedia(messageId, 'audio');
          
          if (!audioRefs.current[messageId]) {
            console.error('Audio element not found for message:', messageId);
            return;
          }
          
          if (!audioSrc) {
            // Try to get the audio data from the message itself if available
            const message = messages.find(m => m.id === messageId);
            if (message?.fileData && message.fileData instanceof Blob) {
              // If we have the blob data, create an object URL
              const objectUrl = URL.createObjectURL(message.fileData);
              const audioElement = audioRefs.current[messageId];
              if (audioElement) {
                audioElement.src = objectUrl;
              }
            } else {
              console.error('No audio data found in storage or message for message:', messageId);
              return;
            }
          } else {
            // Use the stored audio source
            const audioElement = audioRefs.current[messageId];
            if (audioElement) {
              audioElement.src = audioSrc;
            }
          }
          
          // Set up event listeners for the audio element
          const currentAudio = audioRefs.current[messageId];
          if (currentAudio) {
            currentAudio.onplay = () => setPlayingAudioId(messageId);
            currentAudio.onerror = (e) => {
              console.error('Audio playback error:', e);
              setPlayingAudioId(null);
            };
            
            // Play the audio
            await currentAudio.play().catch(error => {
              console.error('Error playing audio:', error);
              setPlayingAudioId(null);
            });
          }
        } catch (error) {
          console.error('Error playing audio:', error);
          setPlayingAudioId(null);
        }
      } else {
        audio.pause();
        audio.currentTime = 0;
        setPlayingAudioId(null);
      }
    } catch (error) {
      console.error('Error in toggleAudioPlayback:', error);
      setPlayingAudioId(null);
    }
  }, [playingAudioId]);
  
  // Function to safely get stored media from localStorage
  // with proper type checking and error handling
  const getStoredMedia = useCallback((id: string | undefined | null, type: 'image' | 'audio' = 'image'): string | null => {
    // Input validation
    if (id === undefined || id === null) {
      console.error('No ID provided to getStoredMedia');
      return null;
    }
    
    if (typeof id !== 'string') {
      console.error('Invalid ID type, expected string:', id);
      return null;
    }
    try {

      const storageKey = type === 'image' ? 'chatImages' : 'chatAudios';
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        console.warn(`No ${type} data found in localStorage for key:`, storageKey);
        return null;
      }
      
      let storedItems;
      try {
        storedItems = JSON.parse(storedData);
      } catch (e) {
        console.error(`Error parsing ${storageKey} data:`, e);
        return null;
      }
      
      if (!Array.isArray(storedItems)) {
        console.error(`Invalid ${type} data format in localStorage. Expected array, got:`, typeof storedItems);
        return null;
      }
      
      const item = storedItems.find((item: any) => item?.id === id || item?.id === String(id));
      if (!item) {
        console.warn(`No ${type} data found for id:`, id, 'Available IDs:', storedItems.map((i: any) => i?.id));
        return null;
      }

      if (!item.dataUrl) {
        console.warn(`Found item for id ${id} but dataUrl is missing`);
        return null;
      }
      
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
        const parts = item.dataUrl.split(',');
        if (parts.length < 2) {
          console.warn('Invalid data URL format:', item.dataUrl);
          return null;
        }
        return `data:audio/wav;base64,${parts[1]}`;
      }
      
      return item.dataUrl;
    } catch (error) {
      console.error(`Error getting stored ${type}:`, error);
      return null;
    }
  }, []);

  // Alias for backward compatibility
  const getStoredImage = useCallback((id: string): string | null => getStoredMedia(id, 'image'), [getStoredMedia]);

  // Function to check if a URL is a blob URL
  const isBlobUrl = useCallback((url: string): boolean => {
    return url.startsWith('blob:');
  }, []);

  // Function to store image data in localStorage
  const storeImageData = useCallback((id: string, data: string | Blob): void => {
    try {
      // Don't store blob URLs as they are temporary
      if (typeof data === 'string' && data.startsWith('blob:')) {
        return;
      }
      
      const storedImages = JSON.parse(localStorage.getItem('chatImages') || '[]');
      const existingIndex = storedImages.findIndex((img: any) => img.id === id);
      
      const updateStoredImages = (dataUrl: string) => {
        if (!dataUrl) return;
        
        // Only store data URLs, not blob URLs
        if (dataUrl.startsWith('data:')) {
          const entry = { id, dataUrl };
          if (existingIndex >= 0) {
            storedImages[existingIndex] = entry;
          } else {
            storedImages.push(entry);
          }
          localStorage.setItem('chatImages', JSON.stringify(storedImages));
        }
      };
      
      // Handle Blob data
      if (data instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            updateStoredImages(reader.result as string);
          }
        };
        reader.onerror = () => {
          console.error('Error reading blob data');
        };
        reader.readAsDataURL(data);
      } 
      // Handle string data (should be a data URL)
      else if (typeof data === 'string') {
        updateStoredImages(data);
      }
    } catch (error) {
      console.error('Error storing image data:', error);
    }
  }, []);

  // Function to safely convert data to a Blob with better type checking
  const toBlob = (data: unknown): Blob | null => {
    try {
      if (data instanceof Blob) return data;
      
      if (data && typeof data === 'object') {
        const blobData = data as Record<string, any>;
        if (blobData.data && blobData.type) {
          return new Blob([blobData.data], { type: String(blobData.type) });
        }
      }
      
      if (typeof data === 'string') {
        return new Blob([data], { type: 'text/plain' });
      }
      
      return null;
    } catch (error) {
      console.error('Error converting to Blob:', error);
      return null;
    }
  };

  // Function to get the best available image source
  const getImageSource = (message: Message): string => {
    try {
      // If it's already a data URL, use it directly
      if (message.text && (message.text.startsWith('data:image/') || message.text.startsWith('blob:'))) {
        return message.text;
      }
      
      // Try to get from localStorage first
      const storedImage = getStoredImage(message.id);
      if (storedImage) {
        return storedImage;
      }
      
      // If we have fileData, try to create a Blob URL
      if (message.fileData) {
        const blob = toBlob(message.fileData);
        if (blob) {
          try {
            const url = URL.createObjectURL(blob);
            // Store the URL for future use
            if (message.id) {
              storeImageData(message.id, url);
            }
            return url;
          } catch (error) {
            console.error('Error creating object URL:', error);
          }
        }
      }
      
      // Fallback to the original text if it exists and looks like a URL
      if (message.text && (message.text.startsWith('http') || message.text.startsWith('/'))) {
        return message.text;
      }
      
      return '';
    } catch (error) {
      console.error('Error getting image source:', error);
      return '';
    }
  };
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Animate new messages
    if (messages.length > 0) {
      gsap.fromTo('.message-bubble:last-child',
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [messages]);

  const formatTime = (timestampOrSeconds: Date | number) => {
    // If it's a Date object or a timestamp in milliseconds, format as time
    if (timestampOrSeconds instanceof Date || timestampOrSeconds > 1000000000) {
      const date = timestampOrSeconds instanceof Date ? timestampOrSeconds : new Date(timestampOrSeconds);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, treat it as a duration in seconds
    const totalSeconds = Math.floor(Number(timestampOrSeconds) || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col w-full space-y-1">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUser;
        return (
          <div 
            key={message.id} 
            className={`w-full flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`} style={{ maxWidth: '85%' }}>
              <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                {!isOwnMessage && (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {message.senderName || 'User'}
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div
                className={`px-4 py-2 rounded-lg break-words ${
                  isOwnMessage
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
                } ${message.type === 'image' ? 'p-0 overflow-hidden' : ''}`}
                style={{ maxWidth: '100%', width: 'fit-content' }}
              >
              {message.type === 'image' ? (
                <div className="relative">
                  <div className="relative">
                    <ImageWithFallback 
                      message={{
                        id: message.id,
                        text: message.text || '',
                        fileData: message.fileDataObj || message.fileData,
                        isStored: message.isStored
                      }}
                      getStoredImage={getStoredImage}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                  <a 
                    href={message.isStored ? message.text : (getStoredImage(message.id) || message.text)}
                    download={`image-${message.id}.${message.fileType?.split('/')[1] || 'jpg'}`}
                    onClick={(e) => {
                      // If it's a blob URL, we need to handle it differently
                      if (message.text.startsWith('blob:')) {
                        e.preventDefault();
                        const storedImage = getStoredImage(message.id);
                        if (storedImage) {
                          const link = document.createElement('a');
                          link.href = storedImage;
                          link.download = `image-${message.id}.${message.fileType?.split('/')[1] || 'jpg'}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }
                    }}
                    className="absolute bottom-2 right-2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70 transition-all"
                    title="Download image"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ) : (message.type === 'file' && (message.fileType?.startsWith('audio/') || message.isAudio)) ? (
                <div className="audio-message-player w-full max-w-xs">
                  <div className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg">
                    <button 
                      className={`play-pause-btn w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        playingAudioId === message.id 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAudioPlayback(message.id);
                      }}
                      aria-label={playingAudioId === message.id ? 'Pause' : 'Play'}
                    >
                      {playingAudioId === message.id ? (
                        <Pause size={16} className="text-white" />
                      ) : (
                        <Play size={16} className="text-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">Voice message</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {message.fileSize && formatFileSize(message.fileSize)}
                      </div>
                    </div>
                    <div className="audio-duration text-xs text-gray-500 dark:text-gray-400">
                      {message.duration ? formatTime(message.duration) : '0:00'}
                    </div>
                    <audio 
                      id={`audio-${message.id}`}
                      ref={(el) => {
                        // Clean up previous instance if it exists
                        if (cleanupRefs.current[message.id]) {
                          cleanupRefs.current[message.id]();
                          delete cleanupRefs.current[message.id];
                        }

                        // Set the new audio element reference
                        audioRefs.current[message.id] = el;
                        
                        if (el) {
                          // Set up duration display when audio metadata is loaded
                          const updateDuration = () => {
                            const duration = Math.floor(el.duration || 0);
                            const durationElement = el.parentElement?.querySelector('.audio-duration');
                            if (durationElement) {
                              durationElement.textContent = formatTime(duration);
                            }
                          };
                          
                          // Set up event listeners
                          el.addEventListener('loadedmetadata', updateDuration);
                          
                          // Store cleanup function
                          cleanupRefs.current[message.id] = () => {
                            el.removeEventListener('loadedmetadata', updateDuration);
                            if (playingAudioId === message.id) {
                              setPlayingAudioId(null);
                            }
                            
                            // Clean up any object URLs
                            if (el.src && el.src.startsWith('blob:')) {
                              URL.revokeObjectURL(el.src);
                            }
                          };
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const target = e.target as HTMLAudioElement;
                        const duration = Math.floor(target.duration || 0);
                        const currentTime = Math.floor(target.currentTime || 0);
                        const durationElement = target.parentElement?.querySelector('.audio-duration');
                        if (durationElement) {
                          durationElement.textContent = formatTime(duration - currentTime);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : message.type === 'file' ? (
                <div className="p-3 bg-white bg-opacity-10 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    {getFileIcon(message.fileType || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{message.fileName || 'File'}</div>
                    {message.fileSize && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(message.fileSize)}
                      </div>
                    )}
                  </div>
                  <a 
                    href={message.text} 
                    download={message.fileName || 'download'}
                    className="p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Download file"
                  >
                    <Download size={18} />
                  </a>
                </div>
              ) : (
                <div className="message-text">{message.text}</div>
              )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Helper function to get appropriate file icon based on file type
function getFileIcon(fileType: string) {
  const type = fileType.split('/')[0];
  const extension = fileType.split('/').pop()?.toLowerCase();
  
  // Document types
  if (type === 'text' || extension?.match(/(docx?|txt|rtf|odt|pages)/)) {
    return <FileText size={24} className="text-blue-500" />;
  }
  // PDF
  if (extension === 'pdf') {
    return <File size={24} className="text-red-500" />;
  }
  // Spreadsheet
  if (extension?.match(/(xlsx?|csv|ods|numbers)/)) {
    return <FileSpreadsheet size={24} className="text-green-500" />;
  }
  // Archive
  if (extension?.match(/(zip|rar|7z|tar|gz)/)) {
    return <FileArchive size={24} className="text-yellow-500" />;
  }
  // Code
  if (extension?.match(/(js|jsx|ts|tsx|py|java|cpp|c|h|html|css|scss|json|xml)/)) {
    return <FileCode size={24} className="text-purple-500" />;
  }
  // Video
  if (type === 'video' || extension?.match(/(mp4|webm|mov|avi|mkv|flv|wmv)/)) {
    return <FileVideo2 size={24} className="text-orange-500" />;
  }
  // Audio
  if (type === 'audio' || extension?.match(/(mp3|wav|ogg|m4a|flac|aac)/)) {
    return <FileAudio size={24} className="text-pink-500" />;
  }
  // Default file icon
  return <File size={24} className="text-gray-500" />;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default ChatArea;