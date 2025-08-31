import React, { useRef, ChangeEvent } from 'react';

interface FileUploadComponentProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  capture?: 'user' | 'environment';
  children: React.ReactNode;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileSelect,
  accept = '*/*',
  multiple = false,
  capture,
  children
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        capture={capture}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default FileUploadComponent;
