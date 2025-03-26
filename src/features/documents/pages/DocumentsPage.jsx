import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { ENTITY_TYPES } from '../../../lib/constants';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import DocumentList from '../components/DocumentList';
import DocumentForm from '../components/DocumentForm';
import DocumentService from '../services/documentService';
import VehicleService from '../../vehicles/services/vehicleService';
import DriverService from '../../drivers/services/driverService';

/**
 * Documents page component
 * @returns {JSX.Element} Documents page component
 */
const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const { showToast, showError } = useToast();
  const location = useLocation();
  
  // Parse query params for entity filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('entityType');
    const id = searchParams.get('entityId');
    
    if (type && id) {
      setEntityType(type);
      setEntityId(id);
      
      // Fetch entity details for context
      const fetchEntityDetails = async () => {
        try {
          if (type === ENTITY_TYPES.VEHICLE) {
            const vehicle = await VehicleService.getVehicleById(id);
            setSelectedEntity(vehicle);
          } else if (type === ENTITY_TYPES.DRIVER) {
            const driver = await DriverService.getDriverById(id);
            setSelectedEntity(driver);
          }
        } catch (error) {
          console.error('Error fetching entity details:', error);
        }
      };
      
      fetchEntityDetails();
    }
  }, [location.search]);
  
  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      let documentsData;
      
      if (entityType && entityId) {
        // Fetch documents for specific entity
        documentsData = await DocumentService.getDocumentsByEntity(entityType, entityId);
      } else {
        // Fetch all documents
        documentsData = await DocumentService.getDocuments();
      }
      
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, showError]);
  
  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  // Handle add document
  const handleAddDocument = () => {
    setSelectedDocument(null);
    setIsFormModalOpen(true);
  };
  
  // Handle view document
  const handleViewDocument = async (document) => {
    try {
      setLoading(true);
      
      // Get document URL
      const url = await DocumentService.getDocumentDownloadUrl(document.id);
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
  
  // Handle edit document
  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setIsFormModalOpen(true);
  };
  
  // Handle delete document
  const handleDeleteDocument = async (document) => {
    if (!window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await DocumentService.deleteDocument(document.id);
      showToast('Document deleted successfully', 'success');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle document form submit
  const handleDocumentSubmit = async (documentData, file) => {
    try {
      setLoading(true);
      
      if (selectedDocument) {
        // Update existing document
        await DocumentService.updateDocument(selectedDocument.id, documentData, file);
        showToast('Document updated successfully', 'success');
      } else {
        // Add new document
        await DocumentService.addDocument(documentData, file);
        showToast('Document added successfully', 'success');
      }
      
      setIsFormModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      showError(error.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };
  
  // Get entity display name
  const getEntityDisplayName = () => {
    if (!selectedEntity) return '';
    
    if (entityType === ENTITY_TYPES.VEHICLE) {
      return `${selectedEntity.plate_number} - ${selectedEntity.model}`;
    } else if (entityType === ENTITY_TYPES.DRIVER) {
      return selectedEntity.name;
    }
    
    return '';
  };
  
  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>
          {entityType 
            ? `${entityType === ENTITY_TYPES.VEHICLE ? 'Vehicle' : 'Driver'} Documents` 
            : 'All Documents'}
        </h1>
        
        {selectedEntity && (
          <div className="entity-info">
            <span className="entity-label">
              {entityType === ENTITY_TYPES.VEHICLE ? 'Vehicle:' : 'Driver:'}
            </span>
            <span className="entity-value">{getEntityDisplayName()}</span>
          </div>
        )}
      </div>
      
      <Card>
        <CardBody>
          {loading && documents.length === 0 ? (
            <div className="loading-container">
              <Loader size="large" text="Loading documents..." />
            </div>
          ) : (
            <DocumentList
              documents={documents}
              loading={loading}
              onViewDocument={handleViewDocument}
              onEditDocument={handleEditDocument}
              onDeleteDocument={handleDeleteDocument}
              entityType={entityType || null}
              hideEntityColumn={!!entityType}
              showAddButton={true}
              onAddDocument={handleAddDocument}
            />
          )}
        </CardBody>
      </Card>
      
      {/* Document Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedDocument ? 'Edit Document' : 'Add Document'}
        size="medium"
      >
        <DocumentForm
          document={selectedDocument}
          entityType={entityType}
          entityId={entityId}
          onSubmit={handleDocumentSubmit}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>
      
      {/* Document View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedDocument?.name || 'View Document'}
        size="large"
      >
        <div className="document-viewer">
          {documentUrl ? (
            <div className="document-frame-container">
              <iframe
                src={documentUrl}
                title={selectedDocument?.name || 'Document'}
                className="document-frame"
                allow="fullscreen"
              ></iframe>
              
              <div className="document-actions">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="loading-container">
              <Loader size="large" text="Loading document..." />
            </div>
          )}
        </div>
      </Modal>
      
      <style jsx>{`
        .documents-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .page-header h1 {
          margin: 0;
          font-size: var(--font-size-2xl);
          color: var(--primary-color);
        }
        
        .entity-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background-color: var(--surface-color);
          padding: 0.5rem 1rem;
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
        }
        
        .entity-label {
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .entity-value {
          font-weight: 600;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }
        
        .document-viewer {
          width: 100%;
          height: 80vh;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
        }
        
        .document-frame-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .document-frame {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: var(--border-radius-md);
        }
        
        .document-actions {
          display: flex;
          justify-content: center;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-color);
        }
        
        .download-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
          border-radius: var(--border-radius-md);
          font-weight: 500;
          transition: background-color var(--transition-fast) ease;
        }
        
        .download-link:hover {
          background-color: #003d80;
        }
        
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          
          .document-viewer {
            height: 60vh;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentsPage;