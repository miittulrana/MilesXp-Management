import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../lib/constants';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';

/**
 * Vehicle List component - displays vehicles in a table format
 * @param {Object} props - Component props
 * @returns {JSX.Element} Vehicle list component
 */
const VehicleList = ({ 
  vehicles, 
  loading, 
  onEdit, 
  onDelete, 
  onAddVehicle 
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  // Handle row click to navigate to vehicle details
  const handleRowClick = (vehicle) => {
    navigate(`${ROUTES.VEHICLES}/${vehicle.id}`);
  };
  
  // Table columns
  const columns = [
    {
      field: 'plate_number',
      title: 'Plate Number',
      sortable: true
    },
    {
      field: 'model',
      title: 'Model',
      sortable: true
    },
    {
      field: 'year',
      title: 'Year',
      sortable: true
    },
    {
      field: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`badge badge-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      field: 'driver_name',
      title: 'Assigned Driver',
      sortable: true,
      render: (value) => value || '-'
    }
  ];
  
  // Add actions column if admin
  if (isAdmin()) {
    columns.push({
      field: 'actions',
      title: 'Actions',
      sortable: false,
      width: '120px',
      render: (_, vehicle) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(vehicle);
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
              onDelete(vehicle);
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
    <div className="vehicle-list">
      <div className="list-header">
        <h2>Vehicles</h2>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={onAddVehicle}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            }
          >
            Add Vehicle
          </Button>
        )}
      </div>
      
      <DataTable
        data={vehicles}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        pagination
        searchable
        searchFields={['plate_number', 'model', 'driver_name']}
        searchPlaceholder="Search vehicles..."
        emptyMessage="No vehicles found"
        defaultSortField="plate_number"
      />
      
      <style jsx>{`
        .vehicle-list {
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
      `}</style>
    </div>
  );
};

VehicleList.propTypes = {
  vehicles: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddVehicle: PropTypes.func.isRequired
};

export default VehicleList;