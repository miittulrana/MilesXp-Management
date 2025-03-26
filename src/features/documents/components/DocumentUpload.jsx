import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/common/Button/Button';

/**
 * Document Upload component for file uploads
 * @param {Object} props - Component props
 * @returns {JSX.Element} Document upload component
 */
const DocumentUpload = ({ 
  onFileChange, 
  error, 
  isRequired = true,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  fileName = ""
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(fileName);
  
  // Handle button click to open file dialog
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileChange(file);
    }
  };
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      onFileChange(file);
    }
  };
  
  return (
    <div className={`document-upload ${dragActive ? 'drag-active' : ''}`}>
      <div 
        className="upload-area"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="file-input"
          accept={accept}
        />
        
        <div className="upload-content">
          <div className="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          
          <div className="upload-text">
            <p className="upload-message">
              {dragActive 
                ? 'Drop your file here' 
                : selectedFileName 
                  ? 'File selected' 
                  : 'Drag & drop your file here, or'
              }
            </p>
            
            {!dragActive && !selectedFileName && (
              <Button 
                type="button" 
                variant="primary" 
                size="small" 
                onClick={handleButtonClick}
              >
                Select File
              </Button>
            )}
            
            {selectedFileName && (
              <div className="selected-file">
                <span className="file-name">{selectedFileName}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={handleButtonClick}
                >
                  Change
                </Button>
              </div>
            )}
            
            <div className="upload-info">
              <small>
                {isRequired ? 'Required' : 'Optional'} - Accepted file types: PDF, Word, Images
              </small>
            </div>
          </div>
        </div>
      </div>
      
      {error && <div className="upload-error">{error}</div>}
      
      <style jsx>{`
        .document-upload {
          width: 100%;
        }
        
        .upload-area {
          position: relative;
          border: 2px dashed var(--border-color);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-lg);
          cursor: pointer;
          transition: all var(--transition-normal) ease;
          background-color: var(--surface-color);
        }
        
        .upload-area:hover, .drag-active .upload-area {
          border-color: var(--primary-color);
          background-color: rgba(0, 77, 153, 0.05);
        }
        
        .file-input {
          position: absolute;
          width: 0;
          height: 0;
          overflow: hidden;
          opacity: 0;
        }
        
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          text-align: center;
        }
        
        .upload-icon {
          color: var(--primary-color);
        }
        
        .upload-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .upload-message {
          margin: 0;
          font-weight: 500;
        }
        
        .upload-info {
          color: var(--text-secondary);
          margin-top: var(--spacing-xs);
        }
        
        .selected-file {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-xs);
        }
        
        .file-name {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--primary-color);
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .upload-error {
          color: var(--error-color);
          font-size: var(--font-size-sm);
          margin-top: var(--spacing-xs);
        }
      `}</style>
    </div>
  );
};

DocumentUpload.propTypes = {
  onFileChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  isRequired: PropTypes.bool,
  accept: PropTypes.string,
  fileName: PropTypes.string
};

export default DocumentUpload;