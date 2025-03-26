import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ROUTES, SERVICE_STATUS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';

/**
 * Service List component to display vehicle service records
 * @param {Object} props - Component props
 * @returns {JSX.Element} Service list component
 */
const ServiceList = ({ 
  serviceRecords, 
  loading, 
  onAddService, 
  onEdit, 
  onDelete,
  showVehicleInfo = true
}) => {
  const navigate = useNavigate();
  
  // Build columns based on whether to show vehicle info
  const baseColumns = [
    {
      field: 'service_date',
      title: 'Service Date',
      sortable: true,
      render: value => formatDate(value)
    },
    {
      field: 'last_service_km',
      title: 'Last Service KM',
      sortable: true,
      render: value => value.toLocaleString()
    },
    {
      field: 'current_km',
      title: 'Current KM',
      sortable: true,
      render: value => value.toLocaleString()
    },
    {
      field: 'next_service_km',
      title: 'Next Service KM',
      sortable: true,
      render: value => value.toLocaleString()
    },
    {
      field: 'km_remaining',
      title: 'KM Remaining',
      sortable: true,
      render: (_, record) => {
        const remaining = record.next_service_km - record.current_km;
        return (
          <span className={`km-remaining ${remaining <= 200 ? 'warning' : ''} ${remaining <= 0 ? 'error' : ''}`}>
            {remaining.toLocaleString()}
          </span>
        );
      }
    },
    {
      field: 'status',
      title: 'Status',
      sortable: true,
      render: value => (
        <span className={`badge badge-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    }
  ];
  
  // Add vehicle columns if showing vehicle info
  const vehicleColumns = showVehicleInfo ? [
    {
      field: 'vehicle.plate_number',
      title: 'Vehicle',
      sortable: true,
      render: (_, record) => record.vehicle?.plate_number || '-'
    },
    {
      field: 'vehicle.model',
      title: 'Model',
      sortable: true,
      render: (_, record) => record.vehicle?.model || '-'
    }
  ] : [];
  
  // Add actions column
  const actionColumn = {
    field: 'actions',
    title: 'Actions',
    sortable: false,
    width: '120px',
    render: (_, record) => (
      <div className="action-buttons">
        <Button
          variant="outline"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(record);
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
            onDelete(record);
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
  };
  
  // Combine columns based on configuration
  const columns = showVehicleInfo
    ? [...vehicleColumns, ...baseColumns, actionColumn]
    : [...baseColumns, actionColumn];
  
  // Handle row click
  const handleRowClick = (record) => {
    if (showVehicleInfo && record.vehicle?.id) {
      navigate(`${ROUTES.VEHICLES}/${record.vehicle.id}`);
    }
  };
  
  // Process data to add km_remaining field
  const processedData = serviceRecords.map(record => ({
    ...record,
    km_remaining: record.next_service_km - record.current_km
  }));
  
  // Count by status for summary
  const countByStatus = processedData.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="service-list">
      <div className="list-header">
        <div className="header-title">
          <h2>Service Records</h2>
          <div className="status-summary">
            {Object.values(SERVICE_STATUS).map(status => (
              <div key={status} className="status-badge">
                <span className={`badge badge-${status.toLowerCase()}`}>
                  {countByStatus[status] || 0} {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <Button
          variant="primary"
          onClick={onAddService}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          }
        >
          Add Service Record
        </Button>
      </div>
      
      <DataTable
        data={processedData}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        pagination
        searchable
        searchFields={showVehicleInfo ? ['vehicle.plate_number', 'vehicle.model'] : []}
        searchPlaceholder="Search service records..."
        emptyMessage="No service records found"
        defaultSortField="created_at"
        defaultSortDirection="desc"
      />
      
      <style jsx>{`
        .service-list {
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
        
        .km-remaining {
          font-weight: 500;
        }
        
        .km-remaining.warning {
          color: var(--warning-color);
        }
        
        .km-remaining.error {
          color: var(--error-color);
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
          
          .status-summary {
            margin-bottom: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  );
};

ServiceList.propTypes = {
  serviceRecords: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onAddService: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  showVehicleInfo: PropTypes.bool
};

export default ServiceList;