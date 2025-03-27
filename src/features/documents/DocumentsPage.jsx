// src/features/documents/DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import documentService from './documentService';
import { useToast } from '../../hooks/useToast';
import { ENTITY_TYPES } from '../../lib/constants';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const { showToast, showError } = useToast();
  
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddDocument = () => {
    setSelectedDocument(null);
    setIsModalOpen(true);
  };
  
  const handleViewDocument = async (document) => {
    try {
      setLoading(true);
      const url = await documentService.getDocumentDownloadUrl(document.id);
      setDocumentUrl(url);
      setSelectedDocument(document);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error getting document URL:', error);
      showError('Failed to retrieve document');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormSubmit = async (documentData, file) => {
    try {
      setLoading(true);
      await documentService.addDocument(documentData, file);
      showToast('Document added successfully', 'success');
      setIsModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      showError('Failed to save document');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      setLoading(true);
      await documentService.deleteDocument(documentId);
      showToast('Document deleted successfully', 'success');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>Documents</h1>
        <Button onClick={handleAddDocument} variant="primary">Add Document</Button>
      </div>
      
      <Card>
        <CardBody>
          {loading && documents.length === 0 ? (
            <div className="loading-container">
              <p>Loading documents...</p>
            </div>
          ) : (
            <table className="basic-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Entity</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No documents found</td>
                  </tr>
                ) : (
                  documents.map(document => (
                    <tr key={document.id}>
                      <td>{document.name}</td>
                      <td>{document.type}</td>
                      <td>
                        {document.entity_type === ENTITY_TYPES.VEHICLE ? 'Vehicle: ' : 'Driver: '}
                        {document.entity_name || 'Unknown'}
                      </td>
                      <td>{new Date(document.issue_date).toLocaleDateString()}</td>
                      <td>{new Date(document.expiry_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${document.status}`}>
                          {document.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button 
                            size="small" 
                            variant="outline" 
                            onClick={() => handleViewDocument(document)}
                          >
                            View
                          </Button>
                          <Button 
                            size="small" 
                            variant="danger" 
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Document"
      >
        <div className="form-placeholder">
          <p>Document form would go here with fields for:</p>
          <ul>
            <li>Document Name</li>
            <li>Document Type</li>
            <li>Entity Type (Vehicle/Driver)</li>
            <li>Entity Selection</li>
            <li>Issue Date</li>
            <li>Expiry Date</li>
            <li>File Upload</li>
          </ul>
          <div className="form-actions">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                showToast('This is a simplified version', 'info');
                setIsModalOpen(false);
              }}
            >
              Save Document
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedDocument?.name || 'View Document'}
        size="large"
      >
        {documentUrl ? (
          <div className="document-viewer">
            <iframe
              src={documentUrl}
              title={selectedDocument?.name || 'Document'}
              width="100%"
              height="500px"
              style={{ border: 'none', borderRadius: '4px' }}
            />
            <div className="document-actions">
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
              >
                Download Document
              </a>
            </div>
          </div>
        ) : (
          <p>Loading document...</p>
        )}
      </Modal>
      
      <style jsx>{`
        .documents-page {
          padding: 20px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }
        
        .basic-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .basic-table th, .basic-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.valid {
          background-color: #e6f7ee;
          color: #0d9f6e;
        }
        
        .status-badge.expiring_soon {
          background-color: #fff7e6;
          color: #d97706;
        }
        
        .status-badge.expired {
          background-color: #fee2e2;
          color: #dc2626;
        }
        
        .action-buttons {
          display: flex;
          gap: 5px;
        }
        
        .document-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .document-actions {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }
        
        .download-link {
          padding: 8px 16px;
          background-color: #1e88e5;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
        }
        
        .form-placeholder {
          padding: 20px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default DocumentsPage;