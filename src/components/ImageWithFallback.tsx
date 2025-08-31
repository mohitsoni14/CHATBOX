import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
  message: {
    id: string;
    text: string;
    fileData?: Blob;
    isStored?: boolean;
  };
  getStoredImage: (id: string) => string | null;
  className?: string;
}

export default function ImageWithFallback({ 
  message, 
  getStoredImage, 
  className = '' 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    const loadImage = async () => {
      try {
        // First try to get from stored data
        const storedImage = getStoredImage(message.id);
        if (storedImage) {
          if (isMounted) {
            setImgSrc(storedImage);
            setIsLoading(false);
          }
          return;
        }

        // If we have fileData, create a blob URL
        if (message.fileData) {
          try {
            // Handle case where fileData might be a plain object with data and type
            let blob: Blob;
            if (message.fileData instanceof Blob) {
              blob = message.fileData;
            } else if (message.fileData && typeof message.fileData === 'object') {
              // If it's a plain object, try to create a Blob from it
              const fileData = message.fileData as any;
              if (fileData.data && fileData.type) {
                blob = new Blob([fileData.data], { type: fileData.type });
              } else {
                // If we can't create a proper Blob, try to use the data as is
                blob = new Blob([JSON.stringify(message.fileData)], { type: 'application/json' });
              }
            } else {
              throw new Error('Invalid file data format');
            }

            const url = URL.createObjectURL(blob);
            if (isMounted) {
              setImgSrc(url);
              objectUrl = url;
              setIsLoading(false);
            }
            return;
          } catch (error) {
            console.error('Error creating object URL:', error);
            if (isMounted) {
              setHasError(true);
              setIsLoading(false);
            }
            return;
          }
        }

        // Fallback to message text if it's a data URL
        if (message.text.startsWith('data:image/')) {
          if (isMounted) {
            setImgSrc(message.text);
            setIsLoading(false);
          }
          return;
        }

        // If we get here, we don't have a valid image source
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message.id, message.text, message.fileData, getStoredImage]);

  const handleError = () => {
    const storedImage = getStoredImage(message.id);
    if (storedImage && storedImage !== imgSrc) {
      setImgSrc(storedImage);
    } else {
      setHasError(true);
    }
  };

  if (hasError || isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
        <div className="text-center p-4">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading image...</p>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p>Unable to load image</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <img 
      src={imgSrc}
      alt="Shared content"
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
