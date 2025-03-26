import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ROUTES, ASSIGNMENT_STATUS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';

/**
 * Assignment List component for displaying vehicle assignments
 * @param {Object} props - Component props
 * @returns {JSX.Element} Assignment list component
 */
const AssignmentList = ({ 
  assignments, 
  loading, 
  onAddAssignment, 
  onEdit,
  onCancel,
  onComplete,
  showVehicleInfo = true,
  showDriverInfo = true
}) => {
  const navigate = useNavigate();
  
  // Base columns (always show these)
  const baseColumns = [
    {
      field: 'start_date',
      title: 'Start Date',
      sortable: true,
      render: value => formatDate(value)
    },
    {
      field: 'end_date',
      title: 'End Date',
      sortable: true,
      render: value => formatDate(value)
    },
    {
      field: 'reason',
      title: 'Reason',
      sortable: true,
      render: value => value || '-'
    },
    {
      field: 'status',
      title: 'Status',
      sortable: true,
      render: value => (
        <span className={`badge badge-${value.toLowerCase()}`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      field: 'assigned_by_name',
      title: 'Assigned By',
      sortable: true,
      render: value => value || '-'
    }
  ];
  
  // Vehicle info columns (conditionally added)
  const vehicleColumns = showVehicleInfo ? [
    {
      field: 'vehicle_plate',
      title: 'Vehicle',
      sortable: true,
      render: (value, row) => (
        <div className="vehicle-cell">
          <span>{value}</span>
          <Button
            variant="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${ROUTES.VEHICLES}/${row.vehicle_id}`);
            }}
          >
            View
          </Button>
        </div>
      )
    }
  ] : [];
  
  // Driver info columns (conditionally added)
  const driverColumns = showDriverInfo ? [
    {
      field: 'driver_name',
      title: 'Driver',
      sortable: true,
      render: (value, row) => (
        <div className="driver-cell">
          <span>{value}</span>
          <Button
            variant="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${ROUTES.DRIVERS}/${row.driver_id}`);
            }}
          >
            View
          </Button>
        </div>
      )
    }
  ] : [];
  
  // Actions column
  const actionsColumn = {
    field: 'actions',
    title: 'Actions',
    sortable: false,
    width: '180px',
    render: (_, row) => {
      // Only show actions for active assignments
      if (row.status !== ASSIGNMENT_STATUS.ACTIVE) {
        return null;
      }
      
      return (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
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
            variant="success"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(row);
            }}
            className="action-button"
            title="Complete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </Button>
          
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(row);
            }}
            className="action-button"
            title="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </Button>
        </div>
      );
    }
  };
  
  // Combine all columns based on configuration
  const columns = [
    ...vehicleColumns,
    ...driverColumns,
    ...baseColumns,
    actionsColumn
  ];
  
  // Count assignments by status
  const countByStatus = assignments.reduce((acc, assignment) => {
    acc[assignment.status] = (acc[assignment.status] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="assignment-list">
      <div className="list-header">
        <div className="header-title">
          <h2>Vehicle Assignments</h2>
          <div className="status-summary">
            {Object.values(ASSIGNMENT_STATUS).map(status => (
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
          onClick={onAddAssignment}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          }
        >
          New Assignment
        </Button>
      </div>
      
      <DataTable
        data={assignments}
        columns={columns}
        loading={loading}
        pagination
        searchable
        searchFields={[
          ...(showVehicleInfo ? ['vehicle_plate'] : []),
          ...(showDriverInfo ? ['driver_name'] : []),
          'reason',
          'assigned_by_name'
        ]}
        searchPlaceholder="Search assignments..."
        emptyMessage="No assignments found"
        defaultSortField="start_date"
        defaultSortDirection="desc"
      />
      
      <style jsx>{`
        .assignment-list {
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
        
        .vehicle-cell, 
        .driver-cell {
          display: flex;
          align-items: center;
          justify-content: space-between;
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

AssignmentList.propTypes = {
  assignments: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onAddAssignment: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  showVehicleInfo: PropTypes.bool,
  showDriverInfo: PropTypes.bool
};

export default AssignmentList;