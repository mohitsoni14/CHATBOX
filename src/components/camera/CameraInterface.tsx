import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCw, X } from 'lucide-react';

interface CameraInterfaceProps {
  onCapture: (data: { url: string, blob: Blob, dataUrl: string }) => void;
  onClose: () => void;
}

const CameraInterface: React.FC<CameraInterfaceProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>('none');
  const [showFilters, setShowFilters] = useState(false);
  
  const filters = [
    { name: 'None', value: 'none' },
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Invert', value: 'invert(100%)' },
    { name: 'Blur', value: 'blur(2px)' },
    { name: 'Brightness', value: 'brightness(1.5)' },
    { name: 'Contrast', value: 'contrast(150%)' },
    { name: 'Saturate', value: 'saturate(200%)' },
    { name: 'Hue Rotate', value: 'hue-rotate(90deg)' },
  ];
  
  const currentFilterRef = useRef<string>('none');

  const initCamera = useCallback(async () => {
    try {
      console.log('Initializing camera...');
      
      // Check if we have media devices access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // First try with environment (back) camera
      let mediaStream;
      
      try {
        console.log('Trying back camera...');
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 16/9 }
          },
          audio: false
        };
        console.log('Using constraints:', JSON.stringify(constraints));
        
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Back camera access successful');
      } catch (backCameraError) {
        console.warn('Back camera not available, trying front camera:', backCameraError);
        // If back camera fails, try front camera
        try {
          console.log('Trying front camera...');
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
          console.log('Front camera access successful');
          setIsFrontCamera(true);
        } catch (frontCameraError) {
          console.error('Front camera also failed:', frontCameraError);
          throw new Error('Could not access any camera. Please check permissions and try again.');
        }
      }
      
      if (!mediaStream) {
        throw new Error('No camera stream available');
      }
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }
      
      console.log('Setting video source and playing...');
      videoRef.current.srcObject = mediaStream;
      
      // Set up a promise that resolves when the video is playing
      try {
        console.log('Waiting for video to play...');
        await videoRef.current.play();
        console.log('Video is playing');
        setStream(mediaStream);
        setError(null);
      } catch (playError) {
        console.error('Error playing video:', playError);
        throw new Error('Could not start the camera. Please check browser permissions.');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please ensure you have granted camera permissions.');
    }
  }, []);

  useEffect(() => {
    currentFilterRef.current = currentFilter;
    
    // Check if we're in a secure context
    if (window.isSecureContext) {
      initCamera();
    } else {
      setError('Camera access requires a secure context (HTTPS or localhost)');
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const captureImage = async () => {
    if (!videoRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Apply mirror effect for front camera
      if (isFrontCamera) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      // Draw the current video frame to canvas with the selected filter
      ctx.filter = currentFilter;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      
      // Reset the transformation
      if (isFrontCamera) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      // Add a small delay to show the capture animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture({
            url: URL.createObjectURL(blob),
            blob,
            dataUrl
          });
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const switchCamera = async () => {
    if (!stream || isCapturing) return;

    const currentTrack = stream.getVideoTracks()[0];
    if (!currentTrack) return;

    const currentFacingMode = currentTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    try {
      setIsCapturing(true);
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: newFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      // Stop old stream
      stream.getTracks().forEach(track => track.stop());
      setStream(newStream);
      setIsFrontCamera(newFacingMode === 'user');
      
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
    }
  };

  if (error) {
    return (
      <div className="camera-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Camera Feed */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ filter: currentFilter }}
        />
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-sm">
          {filters.find(f => f.value === currentFilter)?.name || 'No Filter'}
        </div>
      </div>
      
      {/* Camera Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/30 p-3 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors"
              disabled={isCapturing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M21 4H7"/>
                <path d="M15 4h3"/>
                <path d="M3 8h18"/>
                <path d="M9 12h8"/>
                <path d="M5 16h12"/>
                <path d="M17 20h2"/>
                <path d="M12 20h-2"/>
                <path d="M3 4h3"/>
              </svg>
            </button>
            <button
              onClick={switchCamera}
              className="bg-white/30 p-3 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors"
              disabled={isCapturing}
            >
              <RotateCw className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={captureImage}
              className={`w-16 h-16 rounded-full bg-white ring-4 ring-white/30 flex items-center justify-center ${
                isCapturing ? 'opacity-50' : 'hover:scale-105 transform transition-transform'
              }`}
              disabled={isCapturing}
            >
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <button
              onClick={onClose}
              className="bg-white/30 p-3 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors"
              disabled={isCapturing}
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {showFilters && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg max-w-xs w-screen">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filters</h3>
              <div className="grid grid-cols-3 gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setCurrentFilter(filter.value);
                      currentFilterRef.current = filter.value;
                      setShowFilters(false);
                    }}
                    className={`p-2 rounded-lg text-sm ${
                      currentFilter === filter.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    } transition-colors`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Status Message */}
        {isCapturing && (
          <div className="text-center text-white text-sm">Capturing photo...</div>
        )}
      </div>
    </div>
  );
};

export default CameraInterface;
