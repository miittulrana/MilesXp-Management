import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../../lib/constants';
import userService from './userService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../lib/utils';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Loader from '../../components/common/Loader/Loader';
import DataTable from '../../components/common/DataTable/DataTable';
import ConfirmDialog from '../../components/common/Dialog/ConfirmDialog';
import UserForm from './UserForm';
import PasswordDisplay from './PasswordDisplay';

/**
 * Users management page component
 */
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { userDetails } = useAuth();
  const navigate = useNavigate();

  // Check if current user is admin
  useEffect(() => {
    if (userDetails && userDetails.role !== ROLES.ADMIN) {
      showError('You do not have permission to access this page');
      navigate(ROUTES.DASHBOARD);
    }
  }, [userDetails, navigate, showError]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users list');
      const data = await userService.getUsers();
      setUsers(data);
      console.log(`Fetched ${data.length} users`);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Handle add user button click
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsAddModalOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    console.log('Editing user:', user);
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Handle adding a new user
  const handleAddUserSubmit = async (userData) => {
    console.log('User form submitted with data:', userData);
    
    try {
      setIsSubmitting(true);
      console.log('Starting user creation process...');
      
      // Validate required fields client-side before sending to API
      if (!userData.name || !userData.email || !userData.role) {
        showError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Add timestamp for debugging
      console.log(`${new Date().toISOString()} - Calling userService.addUser`);
      const result = await userService.addUser(userData);
      console.log('User creation successful:', result);
      
      if (result && result.password) {
        setNewPassword(result.password);
        setSelectedUser(result);
        setIsPasswordModalOpen(true);
      }
      
      showSuccess('User added successfully');
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      // More detailed error message
      const errorMessage = error.message || 'Failed to add user';
      console.error('Error details:', errorMessage);
      showError(errorMessage);
    } finally {
      console.log('User creation process completed');
      setIsSubmitting(false);
    }
  };

  // Handle updating a user
  const handleEditUserSubmit = async (userData) => {
    try {
      setIsSubmitting(true);
      console.log('Updating user:', userData);
      
      await userService.updateUser(selectedUser.id, userData);
      showSuccess('User updated successfully');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showError(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (userId) => {
    try {
      setLoading(true);
      console.log('Resetting password for user ID:', userId);
      
      const result = await userService.resetPassword(userId);
      
      if (result.isEmail) {
        showSuccess('Password reset email sent successfully');
      } else if (result.newPassword) {
        setNewPassword(result.newPassword);
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        setIsPasswordModalOpen(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete dialog open
  const handleDeleteDialog = (user) => {
    console.log('Opening delete dialog for user:', user);
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsDeleting(true);
      console.log('Deleting user ID:', selectedUser.id);
      
      await userService.deleteUser(selectedUser.id);
      showSuccess('User deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle copying password to clipboard
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    showSuccess('Password copied to clipboard');
  };

  // DataTable columns configuration
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
      sortable: false,
      render: (value) => value || '—'
    },
    {
      field: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`role-badge ${value}`}>
          {value}
        </span>
      )
    },
    {
      field: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      field: 'actions',
      title: 'Actions',
      sortable: false,
      render: (_, user) => (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="small"
            onClick={() => handleEditUser(user)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={() => handleResetPassword(user.id)}
          >
            Reset Password
          </Button>
          {user.id !== userDetails?.id && (
            <Button
              variant="danger"
              size="small"
              onClick={() => handleDeleteDialog(user)}
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="users-page p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Users Management</h1>
        <Button
          variant="primary"
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader title="All Users" />
        <CardBody>
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            pagination={true}
            pageSize={10}
            emptyMessage="No users found"
            sortable={true}
            defaultSortField="name"
            searchable={true}
            searchFields={['name', 'email', 'role']}
          />
        </CardBody>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add New User"
      >
        <UserForm
          onSubmit={handleAddUserSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
          isEdit={false}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit User"
      >
        {selectedUser && (
          <UserForm
            initialValues={selectedUser}
            onSubmit={handleEditUserSubmit}
            onCancel={() => setIsEditModalOpen(false)}
            isSubmitting={isSubmitting}
            isEdit={true}
          />
        )}
      </Modal>

      {/* Password Display Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="New Password"
      >
        <PasswordDisplay
          password={newPassword}
          userName={selectedUser?.name || 'user'}
          onCopy={handleCopyPassword}
        />
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user ${selectedUser?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      <style jsx>{`
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .role-badge.admin {
          background-color: rgba(0, 77, 153, 0.1);
          color: var(--primary-color);
        }
        
        .role-badge.driver {
          background-color: rgba(255, 119, 0, 0.1);
          color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
};

export default UsersPage;