import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Send, Camera, Mic, Paperclip, Smile, Bot, X } from 'lucide-react';
import ChatbotOverlay from './ChatbotOverlay';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

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
}

interface InputAreaProps {
  onSendMessage: (message: MessageData) => void;
  onOpenChatbot: () => void;
  isConnected?: boolean;
}

const storeImageData = (id: string, dataUrl: string) => {
  try {
    console.log('Storing image data for ID:', id);
    console.log('Data URL starts with:', dataUrl.substring(0, 50) + '...');
    const storedImages = JSON.parse(localStorage.getItem('chatImages') || '[]');
    console.log('Current stored images count:', storedImages.length);
    // Keep only the last 50 images to prevent localStorage overflow
    const newImage = { id, dataUrl };
    const recentImages = [...storedImages, newImage].slice(-50);
    localStorage.setItem('chatImages', JSON.stringify(recentImages));
    console.log('Successfully stored image. New count:', recentImages.length);
  } catch (error) {
    console.error('Error storing image data:', error);
  }
};

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onOpenChatbot, isConnected = true }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const currentFilterRef = useRef<string>('none');

  const captureImageFromVideo = (video: HTMLVideoElement): Promise<{ url: string, blob: Blob, dataUrl: string } | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      // Apply the current filter to the canvas context
      ctx.filter = currentFilterRef.current;
      
      // Draw the current video frame to canvas with filter
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Reset filter for any subsequent operations
      ctx.filter = 'none';
      
      // Get the data URL for persistence
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Also get the blob for file operations
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            url: URL.createObjectURL(blob),
            blob: blob,
            dataUrl: dataUrl
          });
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const showCameraInterface = async () => {
    try {
      // Check if running on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Function to store image data in localStorage
      const storeImageData = (id: string, dataUrl: string) => {
        try {
          // Store only the most recent 20 images to prevent localStorage from getting too large
          const storedImages = JSON.parse(localStorage.getItem('chatImages') || '[]');
          storedImages.push({ id, dataUrl, timestamp: Date.now() });
          
          // Keep only the 20 most recent images
          const recentImages = storedImages.slice(-20);
          localStorage.setItem('chatImages', JSON.stringify(recentImages));
        } catch (error) {
          console.error('Error storing image data:', error);
        }
      };
      
      // Check if the browser supports mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to file input if MediaDevices API is not supported
        if (isMobile) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const messageId = Date.now().toString();
              // Store the image data for persistence
              const reader = new FileReader();
              reader.onload = async () => {
                if (reader.result) {
                  const base64Data = reader.result.toString();
                  storeImageData(messageId, base64Data);
                  
                  onSendMessage({
                    id: messageId,
                    text: base64Data, // Use base64 data directly
                    sender: 'user',
                    timestamp: new Date(),
                    type: 'image',
                    fileData: file,
                    isStored: true,
                    fileType: file.type
                  });
                }
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        } else {
          alert('Camera access is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
        }
        return;
      }
      
      if (isMobile) {
        // For mobile devices, use camera capture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera by default
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const messageId = Date.now().toString();
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                const base64Data = reader.result.toString();
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
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        // For desktop, use the MediaDevices API to access the camera
        let stream;
        try {
          // First try with environment camera (back camera on mobile)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            });
          } catch (envError) {
            console.log('Environment camera not available, trying user-facing camera...', envError);
            // Fallback to user-facing camera (front camera)
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            });
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          let errorMessage = 'Could not access the camera. ';
          
          if (err instanceof DOMException) {
            switch (err.name) {
              case 'NotAllowedError':
                errorMessage += 'Please ensure you have granted camera permissions.';
                break;
              case 'NotFoundError':
                errorMessage += 'No camera found. Please check if your camera is connected.';
                break;
              case 'NotReadableError':
                errorMessage += 'Camera is already in use by another application.';
                break;
              case 'OverconstrainedError':
                errorMessage += 'The requested camera configuration is not supported.';
                break;
              default:
                errorMessage += `Error: ${err.message}`;
            }
          } else {
            errorMessage += 'An unknown error occurred.';
          }
          
          alert(errorMessage);
          console.error('Camera error details:', {
            name: err.name,
            message: err.message,
            constraint: err.constraint,
            stack: err.stack
          });
          return null;
        }
        
        // Create a container for the camera interface
        const container = document.createElement('div');
        container.id = 'camera-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        
        // Add container to the document body
        document.body.appendChild(container);
        
        // Function to clean up the camera stream and UI
        const cleanupCamera = () => {
          if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
          }
          const existingContainer = document.getElementById('camera-container');
          if (existingContainer) {
            document.body.removeChild(existingContainer);
          }
        };
        
        // Create video element for camera preview
        const video = document.createElement('video');
        video.style.width = '100%';
        video.style.maxWidth = '500px';
        video.style.borderRadius = '8px';
        video.style.marginBottom = '20px';
        video.autoplay = true;
        video.playsInline = true;
        
        // Set the stream to the video element and play it
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(err => {
            console.error('Error playing video:', err);
          });
        };
        
        // Create a preview container
        const previewContainer = document.createElement('div');
        previewContainer.style.position = 'relative';
        previewContainer.style.width = '100%';
        previewContainer.style.maxWidth = '500px';
        previewContainer.style.display = 'flex';
        previewContainer.style.flexDirection = 'column';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.borderRadius = '8px';
        previewContainer.style.overflow = 'hidden';
        previewContainer.style.backgroundColor = '#000';
        
        // Create video wrapper
        const videoWrapper = document.createElement('div');
        videoWrapper.style.width = '100%';
        videoWrapper.style.position = 'relative';
        videoWrapper.style.overflow = 'hidden';
        
        // Add filter class to video element
        video.style.filter = 'none';
        video.style.transition = 'filter 0.3s ease';
        videoWrapper.appendChild(video);
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '20px';
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.width = '40px';
        closeBtn.style.height = '40px';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.alignItems = 'center';
        closeBtn.onclick = cleanupCamera;
        container.appendChild(closeBtn);
        
        // Create capture button with modern, animated design
        const captureBtn = document.createElement('button');
        captureBtn.innerHTML = `
          <div style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: radial-gradient(circle, #ffffff 0%, #f0f0f0 100%);
            border: 4px solid rgba(255, 255, 255, 0.4);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2),
                        0 8px 25px rgba(0, 0, 0, 0.3);
            overflow: visible;
          ">
            <!-- Outer ring with pulse animation -->
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: 2px solid rgba(255, 255, 255, 0.6);
              animation: pulse 2s infinite;
            "></div>
            
            <!-- Inner circle with gradient -->
            <div style="
              width: 68px;
              height: 68px;
              border-radius: 50%;
              background: linear-gradient(135deg, #4a6cf7 0%, #2541b2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            ">
              <!-- Shine effect -->
              <div style="
                position: absolute;
                top: -10%;
                left: -10%;
                width: 120%;
                height: 120%;
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%);
                opacity: 0.4;
                border-radius: 50%;
              "></div>
              
              <!-- Camera icon -->
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          </div>
        `;
        // Style the button container
        captureBtn.style.border = 'none';
        captureBtn.style.background = 'transparent';
        captureBtn.style.cursor = 'pointer';
        captureBtn.style.outline = 'none';
        captureBtn.style.margin = '0 20px';
        captureBtn.style.padding = '0';
        captureBtn.style.transition = 'transform 0.2s ease';
        
        // Add hover effect
        captureBtn.onmouseover = () => {
          captureBtn.style.transform = 'scale(1.05)';
        };
        captureBtn.onmouseout = () => {
          captureBtn.style.transform = 'scale(1)';
        };
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.position = 'absolute';
        cancelBtn.style.top = '20px';
        cancelBtn.style.left = '20px';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '20px';
        cancelBtn.style.cursor = 'pointer';
        
        // Create button container if it doesn't exist
        let buttonContainer = document.getElementById('camera-button-container') as HTMLDivElement;
        if (!buttonContainer) {
          buttonContainer = document.createElement('div');
          buttonContainer.id = 'camera-button-container';
          buttonContainer.style.display = 'flex';
          buttonContainer.style.justifyContent = 'center';
          buttonContainer.style.gap = '20px';
          buttonContainer.style.marginTop = '20px';
          buttonContainer.style.width = '100%';
        }
        buttonContainer.style.padding = '20px 0';
        buttonContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        buttonContainer.style.borderRadius = '0 0 8px 8px';
        
        // Create filter selector
        const filterContainer = document.createElement('div');
        filterContainer.className = 'flex justify-center flex-wrap gap-2.5 p-4 w-full bg-black/70 rounded-b-lg';
        
        const filters = [
          { name: 'Normal', filter: 'none' },
          { name: 'Clarendon', filter: 'contrast(1.2) saturate(1.35) brightness(1.1)' },
          { name: 'Gingham', filter: 'sepia(0.4) contrast(0.9) brightness(1.1)' },
          { name: 'Moon', filter: 'grayscale(100%) contrast(1.1) brightness(1.1)' },
          { name: 'Lark', filter: 'contrast(0.9) brightness(1.1)' },
          { name: 'Reyes', filter: 'sepia(0.4) saturate(1.5) contrast(0.9) brightness(1.1)' },
          { name: 'Juno', filter: 'hue-rotate(-10deg) contrast(0.9) brightness(1.1) saturate(1.5)' },
          { name: 'Slumber', filter: 'brightness(0.9) saturate(0.8)' },
          { name: 'Crema', filter: 'contrast(0.9) brightness(1.1) saturate(0.9)' },
          { name: 'Ludwig', filter: 'contrast(1.05) brightness(1.05) saturate(1.1)' },
        ];
        
        filters.forEach((filter, index) => {
          const filterBtn = document.createElement('button');
          filterBtn.textContent = filter.name;
          filterBtn.className = `px-3 py-1.5 border-2 border-white/30 rounded-full text-white text-xs cursor-pointer transition-all duration-200 ${
            index === 0 ? 'bg-[#4a6cf7]' : 'bg-white/10 hover:bg-white/20'
          }`;
          
  filterBtn.onclick = () => {
    // Update video filter
    video.style.filter = filter.filter;
            
    // Update active state
    const buttons = document.querySelectorAll('#filterContainer button');
    buttons.forEach(btn => {
      btn.classList.remove('bg-[#4a6cf7]');
      btn.classList.add('bg-white/10', 'hover:bg-white/20');
    });
    filterBtn.classList.remove('bg-white/10', 'hover:bg-white/20');
    filterBtn.classList.add('bg-[#4a6cf7]');
            
    // Update the filter ref with the new filter
    currentFilterRef.current = filter.filter;
  };
          
  filterContainer.appendChild(filterBtn);
});
        
// Add elements to container
previewContainer.appendChild(videoWrapper);
previewContainer.appendChild(filterContainer);
container.appendChild(previewContainer);
        // Add elements to container
        previewContainer.appendChild(videoWrapper);
        previewContainer.appendChild(filterContainer);
        container.appendChild(previewContainer);
        
        // Clear button container and add capture button
        buttonContainer.innerHTML = '';
        buttonContainer.appendChild(captureBtn);
        container.appendChild(buttonContainer);
        document.body.appendChild(container);
        
        // Handle capture
        captureBtn.onclick = async () => {
          // Add capture animation
          captureBtn.style.transform = 'scale(0.9)';
          setTimeout(() => {
            captureBtn.style.transform = 'scale(1)';
          }, 100);
          
          // Capture the image
          const imageData = await captureImageFromVideo(video);
          if (imageData) {
            const messageId = Date.now().toString();
            // Convert blob to base64
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                const base64Data = reader.result.toString();
                storeImageData(messageId, base64Data);
                
                onSendMessage({
                  id: messageId,
                  text: base64Data,
                  sender: 'user',
                  timestamp: new Date(),
                  type: 'image',
                  fileData: imageData.blob,
                  isStored: true,
                  fileType: imageData.blob.type
                });
              }
            };
            reader.readAsDataURL(imageData.blob);
          }
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(container);
        };
        
        // Handle cancel
        const cleanup = () => {
          stream.getTracks().forEach(track => track.stop());
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        };
        
        cancelBtn.onclick = cleanup;
        
        // Handle escape key
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', handleKeyDown);
          }
        };
        
        document.addEventListener('keydown', handleKeyDown);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
      
      // Fallback to file input if camera access fails
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const messageId = Date.now().toString();
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              const base64Data = reader.result.toString();
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
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleSend = () => {
    if (message.trim() && isConnected) {
      onSendMessage({
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user', // This should be the actual user ID
        timestamp: new Date(),
        type: 'text'
      });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && isConnected) {
        onSendMessage({
          id: Date.now().toString(),
          text: message.trim(),
          sender: 'user',
          timestamp: new Date(),
          type: 'text'
        });
        setMessage('');
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow new line with Shift+Enter
      setMessage(prev => prev + '\n');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && isConnected) {
        onSendMessage({
          id: Date.now().toString(),
          text: message.trim(),
          sender: 'user',
          timestamp: new Date(),
          type: 'text'
        });
        setMessage('');
      }
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
            type="button"
            className={`p-2 ${isConnected ? 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400' : 'text-gray-400 dark:text-gray-500'} transition-colors`}
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
            onClick={() => {
              // Handle file attachment
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true; // Allow multiple file selection
              input.accept = '*/*'; // Accept all file types
              
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                
                files.forEach((file) => {
                  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                  const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                  
                  // Create a proper file data structure
                  const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    data: file  // Store the actual File object which is a Blob
                  };

                  const messageData: MessageData = {
                    id: messageId,
                    text: '',
                    sender: 'user',
                    timestamp: new Date(),
                    type: isImage ? 'image' : 'file',
                    fileData: file,  // Store both the file and the structured data
                    fileDataObj: fileData,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    isStored: false
                  };
                  
                  if (isImage) {
                    // For images, read as data URL and store it
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result as string;
                      messageData.text = dataUrl;
                      messageData.isStored = true;
                      storeImageData(messageId, dataUrl);
                      onSendMessage(messageData);
                    };
                    reader.onerror = () => {
                      console.error('Error reading file');
                      // Fallback to just sending the file data
                      messageData.text = file.name;
                      onSendMessage(messageData);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    // For non-image files, just send the file info
                    messageData.text = file.name;
                    onSendMessage(messageData);
                  }
                });
              };
              
              input.click();
            }}
            title="Upload file"
            aria-label="Upload file"
            disabled={!isConnected}
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            className={`p-2 ${isConnected ? 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400' : 'text-gray-400 dark:text-gray-500'} transition-colors`}
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
            onClick={showCameraInterface}
            disabled={!isConnected}
            title={isConnected ? "Take a photo" : "Camera not available"}
            aria-label="Open camera"
          >
            <Camera size={20} />
          </button>
          <button
            type="button"
            className={`p-2 ${isConnected ? 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400' : 'text-gray-400 dark:text-gray-500'} transition-colors`}
            onMouseEnter={(e) => handleButtonHover(e.currentTarget)}
            onMouseLeave={(e) => handleButtonLeave(e.currentTarget)}
            onClick={async () => {
              try {
                // Request microphone permission and start recording
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                let audioChunks: BlobPart[] = [];

                mediaRecorder.ondataavailable = (event) => {
                  audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                  onSendMessage({
                    id: Date.now().toString(),
                    text: 'Audio message',
                    sender: 'user',
                    timestamp: new Date(),
                    type: 'file',
                    fileData: audioBlob
                  });
                  audioChunks = [];
                  stream.getTracks().forEach(track => track.stop());
                };

                // Start recording
                mediaRecorder.start();
                
                // Stop recording after 10 seconds or when clicked again
                setTimeout(() => {
                  if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                  }
                }, 10000);

                // Change button appearance to indicate recording
                const micButton = document.querySelector('.media-btn:last-child');
                if (micButton) {
                  micButton.innerHTML = '<div class="pulse-animation"></div>';
                  micButton.setAttribute('data-recording', 'true');
                }
              } catch (error) {
                console.error('Error accessing microphone:', error);
                alert('Could not access microphone. Please check permissions.');
              }
            }}
            title="Record voice message"
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