import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { ROUTES, DOCUMENT_STATUS, ENTITY_TYPES } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import DocumentService from '../services/documentService';

/**
 * Document Status Page component
 * @returns {JSX.Element} Document status page
 */
const DocumentStatusPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [daysThreshold, setDaysThreshold] = useState(30);
  const { showToast, showError } = useToast();
  const navigate = useNavigate();
  
  // Fetch expiring documents
  useEffect(() => {
    const fetchExpiringDocuments = async () => {
      try {
        setLoading(true);
        const data = await DocumentService.getExpiringDocuments(daysThreshold);
        setDocuments(data);
      } catch (error) {
        console.error('Error fetching expiring documents:', error);
        showError('Failed to load expiring documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpiringDocuments();
  }, [daysThreshold, showError]);
  
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
  
  // Handle navigate to entity
  const handleNavigateToEntity = (entityType, entityId) => {
    if (entityType === ENTITY_TYPES.VEHICLE) {
      navigate(`${ROUTES.VEHICLES}/${entityId}`);
    } else if (entityType === ENTITY_TYPES.DRIVER) {
      navigate(`${ROUTES.DRIVERS}/${entityId}`);
    }
  };
  
  // Handle threshold change
  const handleThresholdChange = (event) => {
    setDaysThreshold(parseInt(event.target.value));
  };
  
  // Group documents by status
  const documentsByStatus = {
    [DOCUMENT_STATUS.EXPIRED]: documents.filter(
      doc => doc.days_remaining < 0
    ),
    [DOCUMENT_STATUS.EXPIRING_SOON]: documents.filter(
      doc => doc.days_remaining >= 0 && doc.days_remaining <= daysThreshold
    ),
    [DOCUMENT_STATUS.VALID]: []
  };
  
  return (
    <div className="document-status-page">
      <div className="page-header">
        <h1>Document Status</h1>
        
        <div className="filter-options">
          <label htmlFor="days-threshold">Show documents expiring in:</label>
          <select
            id="days-threshold"
            value={daysThreshold}
            onChange={handleThresholdChange}
            className="days-select"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <Loader size="large" text="Loading document status..." />
        </div>
      ) : (
        <div className="status-sections">
          {/* Expired Documents */}
          <Card className="status-card status-card-expired">
            <CardHeader title={
              <div className="status-header">
                <span>Expired Documents</span>
                <span className="count-badge">{documentsByStatus[DOCUMENT_STATUS.EXPIRED].length}</span>
              </div>
            } />
            <CardBody>
              {documentsByStatus[DOCUMENT_STATUS.EXPIRED].length === 0 ? (
                <div className="no-documents">No expired documents</div>
              ) : (
                <div className="document-grid">
                  {documentsByStatus[DOCUMENT_STATUS.EXPIRED].map(document => (
                    <DocumentItem
                      key={document.id}
                      document={document}
                      onView={() => handleViewDocument(document)}
                      onNavigate={() => handleNavigateToEntity(document.entity_type, document.entity_id)}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
          
          {/* Expiring Soon Documents */}
          <Card className="status-card status-card-expiring">
            <CardHeader title={
              <div className="status-header">
                <span>Expiring Soon</span>
                <span className="count-badge">{documentsByStatus[DOCUMENT_STATUS.EXPIRING_SOON].length}</span>
              </div>
            } />
            <CardBody>
              {documentsByStatus[DOCUMENT_STATUS.EXPIRING_SOON].length === 0 ? (
                <div className="no-documents">No documents expiring soon</div>
              ) : (
                <div className="document-grid">
                  {documentsByStatus[DOCUMENT_STATUS.EXPIRING_SOON].map(document => (
                    <DocumentItem
                      key={document.id}
                      document={document}
                      onView={() => handleViewDocument(document)}
                      onNavigate={() => handleNavigateToEntity(document.entity_type, document.entity_id)}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
      
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
        .document-status-page {
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
        
        .filter-options {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .filter-options label {
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .days-select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          background-color: var(--background-color);
        }
        
        .status-sections {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }
        
        .status-card {
          overflow: visible;
        }
        
        .status-card-expired {
          border-top: 3px solid var(--error-color);
        }
        
        .status-card-expiring {
          border-top: 3px solid var(--warning-color);
        }
        
        .status-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: var(--surface-color);
          border-radius: 50%;
          font-size: var(--font-size-sm);
          font-weight: 600;
        }
        
        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }
        
        .no-documents {
          padding: var(--spacing-md);
          text-align: center;
          color: var(--text-secondary);
          font-style: italic;
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

// Document Item component used within the status page
const DocumentItem = ({ document, onView, onNavigate }) => {
  // Determine icon based on entity type
  let entityIcon;
  
  if (document.entity_type === ENTITY_TYPES.VEHICLE) {
    entityIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    );
  } else if (document.entity_type === ENTITY_TYPES.DRIVER) {
    entityIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    );
  }
  
  // Determine status and styling for days remaining
  let daysRemainingClass = 'days-remaining';
  let daysRemainingText = '';
  
  if (document.days_remaining < 0) {
    daysRemainingClass += ' expired';
    daysRemainingText = `Expired ${Math.abs(document.days_remaining)} days ago`;
  } else if (document.days_remaining === 0) {
    daysRemainingClass += ' expires-today';
    daysRemainingText = 'Expires today';
  } else {
    daysRemainingClass += ' expiring-soon';
    daysRemainingText = `Expires in ${document.days_remaining} days`;
  }
  
  return (
    <div className="document-item">
      <div className="document-header">
        <h3 className="document-name">{document.name}</h3>
        <span className="document-type">{document.type.replace('_', ' ').toUpperCase()}</span>
      </div>
      
      <div className="document-body">
        <div className="document-entity" onClick={onNavigate}>
          <span className="entity-icon">{entityIcon}</span>
          <span className="entity-name">{document.entity_name}</span>
        </div>
        
        <div className="document-dates">
          <div className="date-item">
            <span className="date-label">Issued:</span>
            <span className="date-value">{formatDate(document.issue_date)}</span>
          </div>
          <div className="date-item">
            <span className="date-label">Expires:</span>
            <span className={`date-value ${document.days_remaining < 0 ? 'expired-date' : ''}`}>
              {formatDate(document.expiry_date)}
            </span>
          </div>
        </div>
        
        <div className={daysRemainingClass}>
          {daysRemainingText}
        </div>
      </div>
      
      <div className="document-footer">
        <Button
          variant="primary"
          size="small"
          onClick={onView}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          }
        >
          View Document
        </Button>
      </div>
      
      <style jsx>{`
        .document-item {
          background-color: var(--surface-color);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: box-shadow var(--transition-fast) ease;
        }
        
        .document-item:hover {
          box-shadow: var(--shadow-md);
        }
        
        .document-header {
          padding: var(--spacing-sm) var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          background-color: var(--background-color);
        }
        
        .document-name {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .document-type {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .document-body {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .document-entity {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-md);
          background-color: rgba(0, 0, 0, 0.02);
          cursor: pointer;
          transition: background-color var(--transition-fast) ease;
        }
        
        .document-entity:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .entity-icon {
          color: var(--text-secondary);
        }
        
        .entity-name {
          font-weight: 500;
        }
        
        .document-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }
        
        .date-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .date-label {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
        }
        
        .date-value {
          font-weight: 500;
        }
        
        .expired-date {
          color: var(--error-color);
        }
        
        .days-remaining {
          font-weight: 500;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-md);
          text-align: center;
          margin-top: var(--spacing-xs);
        }
        
        .expired {
          background-color: rgba(220, 53, 69, 0.1);
          color: var(--error-color);
        }
        
        .expires-today {
          background-color: rgba(220, 53, 69, 0.1);
          color: var(--error-color);
          font-weight: 600;
        }
        
        .expiring-soon {
          background-color: rgba(255, 193, 7, 0.1);
          color: var(--warning-color);
        }
        
        .document-footer {
          padding: var(--spacing-sm) var(--spacing-md);
          border-top: 1px solid var(--border-color);
          background-color: var(--background-color);
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

DocumentItem.propTypes = {
  document: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired
};

export default DocumentStatusPage;