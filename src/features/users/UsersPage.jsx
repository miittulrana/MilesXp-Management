import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../../lib/constants';
import userService from './userService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import DataTable from '../../components/common/DataTable/DataTable';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Form/Input';
import Select from '../../components/common/Form/Select';

/**
 * Users management page component
 */
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.DRIVER
  });

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
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle adding a new user
  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: ROLES.DRIVER
    });
    setIsModalOpen(true);
  };

  // Handle editing a user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (selectedUser) {
        // Update existing user
        await userService.updateUser(selectedUser.id, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role
        });
        showSuccess('User updated successfully');
      } else {
        // Add new user
        const result = await userService.addUser({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        });
        
        if (result && result.password) {
          setNewPassword(result.password);
          setIsPasswordModalOpen(true);
        }
        
        showSuccess('User added successfully');
      }
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showError(error.message || 'An error occurred while saving user');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (userId) => {
    try {
      setLoading(true);
      const result = await userService.resetPassword(userId);
      
      if (result.isEmail) {
        showSuccess('Password reset email sent successfully');
      } else if (result.newPassword) {
        setNewPassword(result.newPassword);
        setIsPasswordModalOpen(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await userService.deleteUser(userId);
      showSuccess('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
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
      render: (value) => value || '-'
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
      field: 'id',
      title: 'Actions',
      sortable: false,
      render: (_, user) => (
        <div className="action-buttons">
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
              onClick={() => handleDeleteUser(user.id)}
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <Button
          variant="primary"
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </div>

      <Card>
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

      {/* User Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required={!selectedUser}
            disabled={!!selectedUser}
            helperText={selectedUser ? "Email cannot be changed" : ""}
          />
          
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
          
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            options={[
              { value: ROLES.ADMIN, label: 'Admin' },
              { value: ROLES.DRIVER, label: 'Driver' }
            ]}
            required
          />
          
          <div className="modal-actions">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
            >
              {selectedUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Display Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="New Password"
      >
        <div className="password-container">
          <p>A new password has been generated. Please save it as you won't be able to see it again:</p>
          
          <div className="password-display">
            {newPassword}
          </div>
          
          <div className="password-actions">
            <Button
              variant="primary"
              onClick={handleCopyPassword}
              fullWidth
            >
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .users-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .role-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .role-badge.admin {
          background-color: rgba(var(--primary-color-rgb), 0.1);
          color: var(--primary-color);
        }
        
        .role-badge.driver {
          background-color: rgba(var(--secondary-color-rgb), 0.1);
          color: var(--secondary-color);
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: var(--spacing-md);
        }
        
        .password-container {
          padding: var(--spacing-md);
        }
        
        .password-display {
          margin: var(--spacing-md) 0;
          padding: var(--spacing-md);
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          font-family: monospace;
          font-size: 16px;
          text-align: center;
        }
        
        .password-actions {
          margin-top: var(--spacing-md);
        }
      `}</style>
    </div>
  );
};

export default UsersPage;