import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DataTable from '../../../components/common/DataTable/DataTable';
import Card, { CardHeader, CardBody } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import { formatDate } from '../../../lib/utils';

/**
 * User List component for displaying users
 * @param {Object} props - Component props
 * @returns {JSX.Element} User list component
 */
const UserList = ({
  users,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onResetPassword
}) => {
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Handle delete confirmation
  const handleConfirmDelete = (user) => {
    setDeleteConfirmUser(user);
    setIsDeleteModalOpen(true);
  };
  
  // Handle delete cancellation
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmUser(null);
  };
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (deleteConfirmUser) {
      onDelete(deleteConfirmUser.id);
      setIsDeleteModalOpen(false);
      setDeleteConfirmUser(null);
    }
  };
  
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
      render: (value) => value || '-'
    },
    {
      field: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`badge ${value === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
          {value === 'admin' ? 'Admin' : 'Driver'}
        </span>
      )
    },
    {
      field: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => formatDate(value, 'YYYY-MM-DD')
    },
    {
      field: 'created_by_name',
      title: 'Created By',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      field: 'actions',
      title: 'Actions',
      sortable: false,
      render: (_, user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => onEdit(user)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </Button>
          
          <Button
            variant="outline"
            size="small"
            onClick={() => onResetPassword(user)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </Button>
          
          <Button
            variant="danger"
            size="small"
            onClick={() => handleConfirmDelete(user)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div className="user-list">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Users</h2>
            <Button onClick={onAdd}>
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <DataTable
            data={users}
            columns={columns}
            pagination
            pageSize={10}
            loading={loading}
            searchable
            searchFields={['name', 'email', 'phone', 'role']}
            defaultSortField="name"
            defaultSortDirection="asc"
            emptyMessage="No users found"
          />
        </CardBody>
      </Card>
      
      {/* Delete confirmation modal */}
      {deleteConfirmUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={handleCancelDelete}
          title="Confirm Delete"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          }
        >
          <div>
            <p className="mb-4">
              Are you sure you want to delete user <strong>{deleteConfirmUser.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
          </div>
        </Modal>
      )}
      
      <style jsx>{`
        .badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge-primary {
          background-color: rgba(0, 77, 153, 0.1);
          color: var(--primary-color);
        }
        
        .badge-secondary {
          background-color: rgba(255, 119, 0, 0.1);
          color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
};

UserList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string,
      role: PropTypes.string.isRequired,
      created_at: PropTypes.string,
      created_by_name: PropTypes.string
    })
  ).isRequired,
  loading: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onResetPassword: PropTypes.func.isRequired
};

export default UserList;