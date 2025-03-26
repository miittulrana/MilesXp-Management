import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ROUTES, DOCUMENT_STATUS, SERVICE_STATUS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';

/**
 * Vehicle Details component - displays a comprehensive view of vehicle information
 * @param {Object} props - Component props
 * @returns {JSX.Element} Vehicle details component
 */
const VehicleDetails = ({ vehicle, documents = [], serviceRecords = [] }) => {
  // Check if any important documents are expired
  const hasExpiredDocuments = documents.some(doc => doc.status === DOCUMENT_STATUS.EXPIRED);
  
  // Get the latest service record
  const latestServiceRecord = serviceRecords.length > 0 
    ? serviceRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;
    
  // Check service status
  const isServiceOverdue = latestServiceRecord?.status === SERVICE_STATUS.OVERDUE;
  const isServiceDueSoon = latestServiceRecord?.status === SERVICE_STATUS.DUE_SOON;

  return (
    <div className="vehicle-details">
      <Card>
        <CardHeader title="Vehicle Information" />
        <CardBody>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Plate Number</div>
              <div className="info-value">{vehicle.plate_number}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Model</div>
              <div className="info-value">{vehicle.model}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Year</div>
              <div className="info-value">{vehicle.year}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value">
                <span className={`badge badge-${vehicle.status.toLowerCase()}`}>
                  {vehicle.status}
                </span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Created At</div>
              <div className="info-value">{formatDate(vehicle.created_at)}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Updated At</div>
              <div className="info-value">{formatDate(vehicle.updated_at)}</div>
            </div>
          </div>
          
          {hasExpiredDocuments && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>This vehicle has expired documents</span>
            </div>
          )}
          
          {(isServiceOverdue || isServiceDueSoon) && (
            <div className={`alert ${isServiceOverdue ? 'alert-error' : 'alert-warning'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>
                {isServiceOverdue 
                  ? 'Service is overdue!' 
                  : `Service due soon (${latestServiceRecord.next_service_km - latestServiceRecord.current_km} km remaining)`
                }
              </span>
            </div>
          )}
        </CardBody>
      </Card>
      
      {vehicle.driver_id && (
        <Card className="card-section">
          <CardHeader title="Assigned Driver" />
          <CardBody>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Name</div>
                <div className="info-value">
                  <Link to={`${ROUTES.DRIVERS}/${vehicle.driver_id}`}>
                    {vehicle.driver_name}
                  </Link>
                </div>
              </div>
              
              {vehicle.driver_email && (
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{vehicle.driver_email}</div>
                </div>
              )}
              
              {vehicle.driver_phone && (
                <div className="info-item">
                  <div className="info-label">Phone</div>
                  <div className="info-value">{vehicle.driver_phone}</div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
      
      <Card className="card-section">
        <CardHeader title="Documents" />
        <CardBody>
          {documents.length === 0 ? (
            <div className="no-data">No documents found for this vehicle</div>
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
                <Link to={`${ROUTES.DOCUMENTS}?entityType=vehicle&entityId=${vehicle.id}`} className="view-all-link">
                  View all documents
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      
      <Card className="card-section">
        <CardHeader title="Service History" />
        <CardBody>
          {serviceRecords.length === 0 ? (
            <div className="no-data">No service records found for this vehicle</div>
          ) : (
            <div className="service-history">
              <table className="service-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Last Service (km)</th>
                    <th>Current (km)</th>
                    <th>Next Service (km)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRecords.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.service_date)}</td>
                      <td>{record.last_service_km}</td>
                      <td>{record.current_km}</td>
                      <td>{record.next_service_km}</td>
                      <td>
                        <span className={`badge badge-${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="service-actions">
                <Link to={`${ROUTES.SERVICE_DUES}?vehicleId=${vehicle.id}`} className="view-all-link">
                  View service history
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      
      <style jsx>{`
        .vehicle-details {
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
        
        .alert-warning {
          background-color: rgba(255, 193, 7, 0.1);
          color: var(--warning-color);
        }
        
        .no-data {
          color: var(--text-secondary);
          font-style: italic;
          text-align: center;
          padding: var(--spacing-md);
        }
        
        .documents-list,
        .service-history {
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
        
        .service-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .service-table th,
        .service-table td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        .service-table th {
          font-weight: 600;
          color: var(--text-primary);
          background-color: var(--surface-color);
        }
        
        .document-actions,
        .service-actions {
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
          
          .service-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

VehicleDetails.propTypes = {
  vehicle: PropTypes.object.isRequired,
  documents: PropTypes.array,
  serviceRecords: PropTypes.array
};

export default VehicleDetails;