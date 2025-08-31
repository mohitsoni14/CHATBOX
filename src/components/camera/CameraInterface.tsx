import React, { useRef, useState, useEffect } from 'react';

interface CameraInterfaceProps {
  onCapture: (data: { url: string, blob: Blob, dataUrl: string }) => void;
  onClose: () => void;
}

const CameraInterface: React.FC<CameraInterfaceProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentFilterRef = useRef<string>('none');

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setStream(mediaStream);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access the camera. Please check permissions.');
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.filter = currentFilterRef.current;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    
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
  };

  const switchCamera = async () => {
    if (!stream) return;

    const currentTrack = stream.getVideoTracks()[0];
    if (!currentTrack) return;

    const currentFacingMode = currentTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    try {
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
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
    }
  };

  if (error) {
    return (
      <div className="camera-error">
        <p>{error}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div className="camera-interface">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-preview"
      />
      <div className="camera-controls">
        <button onClick={captureImage} className="capture-button">
          Capture
        </button>
        <button onClick={switchCamera} className="switch-camera">
          Switch Camera
        </button>
        <button onClick={onClose} className="close-camera">
          Close
        </button>
      </div>
    </div>
  );
};

export default CameraInterface;
