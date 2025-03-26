import React from 'react';
import PropTypes from 'prop-types';
import { DOCUMENT_STATUS, ENTITY_TYPES } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';

/**
 * Document List component for displaying documents in a table
 * @param {Object} props - Component props
 * @returns {JSX.Element} Document list component
 */
const DocumentList = ({ 
  documents, 
  loading, 
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  entityType = null, // Filter by entity type
  hideEntityColumn = false, // Hide entity column when showing for a specific entity
  showAddButton = true, // Whether to show add document button
  onAddDocument
}) => {
  // Prepare table columns
  const baseColumns = [
    {
      field: 'name',
      title: 'Document Name',
      sortable: true
    },
    {
      field: 'type',
      title: 'Type',
      sortable: true,
      render: (value) => value.replace('_', ' ').toUpperCase()
    },
    {
      field: 'issue_date',
      title: 'Issue Date',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      field: 'expiry_date',
      title: 'Expiry Date',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      field: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`badge badge-${value.toLowerCase()}`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      field: 'actions',
      title: 'Actions',
      sortable: false,
      width: '150px',
      render: (_, document) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="small"
            onClick={() => onViewDocument(document)}
            className="action-button"
            title="View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </Button>
          
          <Button
            variant="outline"
            size="small"
            onClick={() => onEditDocument(document)}
            className="action-button"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </Button>
          
          <Button
            variant="outline"
            size="small"
            onClick={() => onDeleteDocument(document)}
            className="action-button"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </Button>
        </div>
      )
    }
  ];
  
  // Add entity column if not hidden
  const entityColumn = {
    field: 'entity_type',
    title: 'Entity',
    sortable: true,
    render: (value, doc) => {
      let entityName = doc.entity_name || ''; 
      let entityIcon;
      
      if (value === ENTITY_TYPES.VEHICLE) {
        entityIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        );
      } else if (value === ENTITY_TYPES.DRIVER) {
        entityIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      }
      
      return (
        <div className="entity-cell">
          <span className="entity-icon">{entityIcon}</span>
          <span className="entity-name">{entityName}</span>
        </div>
      );
    }
  };
  
  // Combine columns based on whether to show entity column
  const columns = hideEntityColumn 
    ? baseColumns 
    : [entityColumn, ...baseColumns];
  
  // Filter documents by entity type if provided
  const filteredDocuments = entityType 
    ? documents.filter(doc => doc.entity_type === entityType)
    : documents;
  
  // Count by status for summary
  const countByStatus = filteredDocuments.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});
  
  // Search fields
  const searchFields = ['name', 'type'];
  
  // If showing entity column, add entity_name to search fields
  if (!hideEntityColumn) {
    searchFields.push('entity_name');
  }
  
  return (
    <div className="document-list">
      <div className="list-header">
        <div className="header-title">
          <h2>Documents</h2>
          <div className="status-summary">
            {Object.values(DOCUMENT_STATUS).map(status => (
              <div key={status} className="status-badge">
                <span className={`badge badge-${status.toLowerCase()}`}>
                  {countByStatus[status] || 0} {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {showAddButton && (
          <Button
            variant="primary"
            onClick={onAddDocument}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            }
          >
            Add Document
          </Button>
        )}
      </div>
      
      <DataTable
        data={filteredDocuments}
        columns={columns}
        loading={loading}
        pagination
        searchable
        searchFields={searchFields}
        searchPlaceholder="Search documents..."
        emptyMessage="No documents found"
        defaultSortField="expiry_date"
        defaultSortDirection="asc"
      />
      
      <style jsx>{`
        .document-list {
          width: 100%;
        }
        
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .header-title {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .header-title h2 {
          margin: 0;
          font-size: var(--font-size-xl);
          color: var(--primary-color);
        }
        
        .status-summary {
          display: flex;
          gap: 0.75rem;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-button {
          padding: 0.25rem;
        }
        
        .entity-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .entity-icon {
          display: flex;
          align-items: center;
          color: var(--text-secondary);
        }
        
        .entity-name {
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
          
          .status-summary {
            margin-bottom: var(--spacing-sm);
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

DocumentList.propTypes = {
  documents: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onViewDocument: PropTypes.func.isRequired,
  onEditDocument: PropTypes.func.isRequired,
  onDeleteDocument: PropTypes.func.isRequired,
  entityType: PropTypes.string,
  hideEntityColumn: PropTypes.bool,
  showAddButton: PropTypes.bool,
  onAddDocument: PropTypes.func
};

export default DocumentList;