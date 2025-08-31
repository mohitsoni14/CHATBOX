// CameraInterface.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCw } from 'lucide-react';

interface CameraInterfaceProps {
  onCapture: (data: { url: string, blob: Blob, dataUrl: string }) => void;
  onClose: () => void;
  // New prop: notify parent with the live MediaStream (or null when closed)
  onStreamAvailable?: (stream: MediaStream | null) => void;
}

const CameraInterface: React.FC<CameraInterfaceProps> = ({ onCapture, onClose, onStreamAvailable }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  const getFriendlyError = (err: any) => {
    if (!err) return 'Could not access the camera.';
    switch (err.name) {
      case 'NotAllowedError':
        return 'Permission Denied. Allow camera access in your browser.';
      case 'NotFoundError':
        return 'No camera found. Attach/enabled one and try again.';
      case 'NotReadableError':
        return 'Camera is already in use by another app or tab.';
      case 'OverconstrainedError':
        return 'Requested camera constraints not supported.';
      default:
        return err.message || 'Could not access the camera.';
    }
  };

  const initCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser.');
      }

      const constraints = { video: { facingMode: isFrontCamera ? 'user' : 'environment' }, audio: false };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!videoRef.current) {
        // Possibly the component unmounted — stop tracks and bail out
        mediaStream.getTracks().forEach(t => t.stop());
        throw new Error('Video element not ready.');
      }

      // attach stream
      videoRef.current.srcObject = mediaStream;

      // play after metadata loaded
      await new Promise<void>((resolve) => {
        const el = videoRef.current!;
        const cleanup = () => {
          el.onloadedmetadata = null;
        };
        el.onloadedmetadata = () => {
          el.play().catch(err => {
            // autoplay might be blocked; still resolve and let user interact if needed
            console.warn('Autoplay prevented:', err);
          }).finally(() => {
            cleanup();
            resolve();
          });
        };
        // Fallback: if metadata already available
        if (el.readyState >= 1) {
          el.play().catch(() => {}).finally(resolve);
        }
      });

      setError(null);
      return mediaStream;
    } catch (err: any) {
      console.error('--- INIT CAMERA FAILED ---', err);
      const friendly = getFriendlyError(err);
      setError(friendly);
      return null;
    }
  }, [isFrontCamera]);

  useEffect(() => {
    if (!window.isSecureContext && !location.hostname.includes('localhost')) {
      setError('Camera access requires a secure context (HTTPS).');
      return;
    }

    let cancelled = false;

    const start = async () => {
      // cleanup any previous
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (onStreamAvailable) onStreamAvailable(null);
      }
      const s = await initCamera();
      if (!cancelled && s) {
        streamRef.current = s;
        if (onStreamAvailable) onStreamAvailable(s);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (onStreamAvailable) onStreamAvailable(null);
      }
      if (videoRef.current) {
        try { videoRef.current.srcObject = null; } catch {}
      }
    };
  }, [initCamera, onStreamAvailable]);

  const stopAndClose = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch {}
    }
    if (onStreamAvailable) onStreamAvailable(null);
    onClose();
  }, [onClose, onStreamAvailable]);

  const captureImage = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    if (isFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.toBlob((blob) => {
      if (blob) onCapture({ url: URL.createObjectURL(blob), blob, dataUrl });
    }, 'image/jpeg', 0.9);
    setIsCapturing(false);
  };

  const switchCamera = () => {
    if (isCapturing) return;
    // flipping facingMode triggers re-init via `useEffect` dependency
    setIsFrontCamera(prev => !prev);
  };

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
        <p className="text-lg mb-4">{error}</p>
        <div className="flex gap-2">
          <button onClick={stopAndClose} className="bg-blue-500 px-4 py-2 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isFrontCamera ? 'transform -scale-x-100' : ''}`}
      />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16" />
          <button
            onClick={captureImage}
            className="w-20 h-20 rounded-full bg-white ring-4 ring-white/50 flex items-center justify-center"
            disabled={isCapturing}
            aria-label="Capture image"
          >
            <Camera className="w-8 h-8 text-black" />
          </button>
          <button
            onClick={switchCamera}
            className="w-16 h-16 bg-black/50 p-3 rounded-full"
            disabled={isCapturing}
            aria-label="Switch camera"
          >
            <RotateCw className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={stopAndClose}
            className="w-12 h-12 bg-red-600 text-white rounded-full ml-2"
            aria-label="Close camera"
            title="Close camera"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;
