import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../hooks/useAuth';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';

/**
 * Driver List component - displays drivers in a table format
 * @param {Object} props - Component props
 * @returns {JSX.Element} Driver list component
 */
const DriverList = ({ 
  drivers, 
  loading, 
  onAddDriver, 
  onEditDriver, 
  onDeleteDriver, 
  onRowClick 
}) => {
  const { isAdmin } = useAuth();
  
  // Table columns
  const columns = [
    {
      field: 'name',
      title: 'Name',
      sortable: true
    },
    {
      field: 'email',
      title: 'Email',
      sortable: true
    },
    {
      field: 'phone',
      title: 'Phone',
      sortable: true,
      render: value => value || '-'
    },
    {
      field: 'assigned_vehicle',
      title: 'Assigned Vehicle',
      sortable: true,
      render: value => value || '-'
    },
    {
      field: 'has_expiring_documents',
      title: 'Documents',
      sortable: true,
      render: value => value ? (
        <span className="badge badge-expiring">Expiring Soon</span>
      ) : (
        <span className="badge badge-valid">Valid</span>
      )
    }
  ];
  
  // Add actions column if admin
  if (isAdmin()) {
    columns.push({
      field: 'actions',
      title: 'Actions',
      sortable: false,
      width: '120px',
      render: (_, driver) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEditDriver(driver);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDriver(driver);
            }}
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
    });
  }
  
  return (
    <div className="driver-list">
      <div className="list-header">
        <h2>Drivers</h2>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={onAddDriver}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            }
          >
            Add Driver
          </Button>
        )}
      </div>
      
      <DataTable
        data={drivers}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        pagination
        searchable
        searchFields={['name', 'email', 'phone', 'assigned_vehicle']}
        searchPlaceholder="Search drivers..."
        emptyMessage="No drivers found"
        defaultSortField="name"
      />
      
      <style jsx>{`
        .driver-list {
          width: 100%;
        }
        
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .list-header h2 {
          margin: 0;
          font-size: var(--font-size-xl);
          color: var(--primary-color);
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-button {
          padding: 0.25rem;
        }
        
        @media (max-width: 768px) {
          .list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  );
};

DriverList.propTypes = {
  drivers: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onAddDriver: PropTypes.func.isRequired,
  onEditDriver: PropTypes.func.isRequired,
  onDeleteDriver: PropTypes.func.isRequired,
  onRowClick: PropTypes.func.isRequired
};

export default DriverList;