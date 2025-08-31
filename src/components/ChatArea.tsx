import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Download, File, FileText, FileImage, FileVideo2, FileAudio, FileArchive, FileSpreadsheet, FileCode } from 'lucide-react';
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
}

interface ChatAreaProps {
  messages: Message[];
  currentUser: string;
  username: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, currentUser, username }) => {
  // Function to get stored image from localStorage
  const getStoredImage = (id: string): string | null => {
    try {
      const storedImages = JSON.parse(localStorage.getItem('chatImages') || '[]');
      const imageData = storedImages.find((img: any) => img.id === id);
      
      if (!imageData) return null;
      
      // If it's a blob URL that might be revoked, try to get the stored data URL
      if (imageData.dataUrl && imageData.dataUrl.startsWith('blob:')) {
        const storedBase64 = storedImages.find((img: any) => 
          img.id === `${id}_base64`
        );
        if (storedBase64) {
          return storedBase64.dataUrl;
        }
      }
      
      return imageData?.dataUrl || null;
    } catch (error) {
      console.error('Error retrieving stored image:', error);
      return null;
    }
  };

  // Function to check if a URL is a blob URL
  const isBlobUrl = (url: string): boolean => {
    return url.startsWith('blob:');
  };

  // Function to store image data in localStorage
  const storeImageData = (id: string, data: string | Blob): void => {
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
          updateStoredImages(reader.result as string);
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
  };

  // Function to safely convert data to a Blob
  const toBlob = (data: any): Blob | null => {
    try {
      if (data instanceof Blob) return data;
      if (data?.data && data.type) {
        return new Blob([data.data], { type: data.type });
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

  const formatTime = (timestamp: Date | number) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUser;
        return (
          <div
            key={message.id}
            className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
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
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
              } ${message.type === 'image' ? 'p-0 overflow-hidden' : ''}`}
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
        );
      })}
      <div ref={messagesEndRef} />
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