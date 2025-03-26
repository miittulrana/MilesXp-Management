import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ROUTES, DOCUMENT_STATUS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';

/**
 * Driver Details component - displays a comprehensive view of driver information
 * @param {Object} props - Component props
 * @returns {JSX.Element} Driver details component
 */
const DriverDetails = ({ driver, documents = [] }) => {
  // Check if any important documents are expired
  const hasExpiredDocuments = documents.some(doc => doc.status === DOCUMENT_STATUS.EXPIRED);
  
  return (
    <div className="driver-details">
      <Card>
        <CardHeader title="Driver Information" />
        <CardBody>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Name</div>
              <div className="info-value">{driver.name}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{driver.email}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Phone</div>
              <div className="info-value">{driver.phone || '-'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Created At</div>
              <div className="info-value">{formatDate(driver.created_at)}</div>
            </div>
          </div>
          
          {hasExpiredDocuments && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>This driver has expired documents</span>
            </div>
          )}
        </CardBody>
      </Card>
      
      {driver.assigned_vehicle_id && (
        <Card className="card-section">
          <CardHeader title="Assigned Vehicle" />
          <CardBody>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Vehicle</div>
                <div className="info-value">
                  <Link to={`${ROUTES.VEHICLES}/${driver.assigned_vehicle_id}`}>
                    {driver.assigned_vehicle}
                  </Link>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      <Card className="card-section">
        <CardHeader title="Documents" />
        <CardBody>
          {documents.length === 0 ? (
            <div className="no-data">No documents found for this driver</div>
          ) : (
            <div className="documents-list">
              {documents.map(document => (
                <div key={document.id} className="document-item">
                  <div className="document-info">
                    <div className="document-title">{document.name}</div>
                    <div className="document-type">{document.type}</div>
                  </div>
                  <div className="document-dates">
                    <div className="document-date">
                      <span>Issued:</span> {formatDate(document.issue_date)}
                    </div>
                    <div className="document-date">
                      <span>Expires:</span> {formatDate(document.expiry_date)}
                    </div>
                  </div>
                  <div className="document-status">
                    <span className={`badge badge-${document.status.toLowerCase()}`}>
                      {document.status}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="document-actions">
                <Link to={`${ROUTES.DOCUMENTS}?entityType=driver&entityId=${driver.id}`} className="view-all-link">
                  View all documents
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      
      <style jsx>{`
        .driver-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .card-section {
          margin-top: var(--spacing-md);
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }
        
        .info-item {
          padding-bottom: var(--spacing-sm);
        }
        
        .info-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        
        .info-value {
          font-weight: 500;
        }
        
        .alert {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--border-radius-md);
          margin-top: var(--spacing-md);
        }
        
        .alert svg {
          flex-shrink: 0;
        }
        
        .alert-error {
          background-color: rgba(220, 53, 69, 0.1);
          color: var(--error-color);
        }
        
        .no-data {
          color: var(--text-secondary);
          font-style: italic;
          text-align: center;
          padding: var(--spacing-md);
        }
        
        .documents-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm);
          background-color: var(--surface-color);
          border-radius: var(--border-radius-md);
        }
        
        .document-title {
          font-weight: 500;
        }
        
        .document-type {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        
        .document-dates {
          font-size: var(--font-size-sm);
        }
        
        .document-date span {
          color: var(--text-secondary);
        }
        
        .document-actions {
          display: flex;
          justify-content: center;
          margin-top: var(--spacing-sm);
        }
        
        .view-all-link {
          font-size: var(--font-size-sm);
          color: var(--primary-color);
          text-decoration: none;
        }
        
        .view-all-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .document-item {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  );
};

DriverDetails.propTypes = {
  driver: PropTypes.object.isRequired,
  documents: PropTypes.array
};

export default DriverDetails;