import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ROUTES, BLOCK_STATUS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';

/**
 * BlockList component for displaying vehicle blocks
 * @param {Object} props - Component props
 * @returns {JSX.Element} Block list component
 */
const BlockList = ({ 
  blocks, 
  loading, 
  onAddBlock, 
  onEdit,
  onComplete,
  showVehicleInfo = true
}) => {
  const navigate = useNavigate();
  
  // Base columns (always shown)
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
      field: 'blocked_by_name',
      title: 'Blocked By',
      sortable: true,
      render: value => value || '-'
    }
  ];
  
  // Vehicle info columns (conditional)
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
  
  // Actions column
  const actionsColumn = {
    field: 'actions',
    title: 'Actions',
    sortable: false,
    width: '120px',
    render: (_, row) => {
      // Only show actions for active blocks
      if (row.status !== BLOCK_STATUS.ACTIVE) {
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
        </div>
      );
    }
  };
  
  // Combine columns based on configuration
  const columns = [
    ...vehicleColumns,
    ...baseColumns,
    actionsColumn
  ];
  
  // Count blocks by status
  const countByStatus = blocks.reduce((acc, block) => {
    acc[block.status] = (acc[block.status] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="block-list">
      <div className="list-header">
        <div className="header-title">
          <h2>Vehicle Blocks</h2>
          <div className="status-summary">
            {Object.values(BLOCK_STATUS).map(status => (
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
          onClick={onAddBlock}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          }
        >
          Block Vehicle
        </Button>
      </div>
      
      <DataTable
        data={blocks}
        columns={columns}
        loading={loading}
        pagination
        searchable
        searchFields={[
          ...(showVehicleInfo ? ['vehicle_plate'] : []),
          'reason',
          'blocked_by_name'
        ]}
        searchPlaceholder="Search blocks..."
        emptyMessage="No vehicle blocks found"
        defaultSortField="start_date"
        defaultSortDirection="desc"
      />
      
      <style jsx>{`
        .block-list {
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
        
        .vehicle-cell {
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

BlockList.propTypes = {
  blocks: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onAddBlock: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  showVehicleInfo: PropTypes.bool
};

export default BlockList;