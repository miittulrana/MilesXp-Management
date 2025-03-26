import React, { useState, useEffect } from 'react';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import userService from '../services/userService';
import { useToast } from '../../../hooks/useToast';

/**
 * Users Page component
 * @returns {JSX.Element} Users page component
 */
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formAction, setFormAction] = useState('add');
  const { showSuccess, showError, showInfo } = useToast();
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Load users from API
  const loadUsers = async () => {
    setLoading(true);
    
    try {
      const result = await userService.getUsers();
      
      if (result.error) {
        showError('Error loading users');
        console.error('Error loading users:', result.error);
      } else {
        setUsers(result.data || []);
      }
    } catch (error) {
      showError('Error loading users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Open modal for adding a new user
  const handleAddUser = () => {
    setSelectedUser(null);
    setFormAction('add');
    setIsModalOpen(true);
  };
  
  // Open modal for editing a user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormAction('edit');
    setIsModalOpen(true);
  };
  
  // Handle user creation
  const handleCreateUser = async (userData) => {
    try {
      const result = await userService.createUser(userData);
      
      if (result.error) {
        showError(`Error creating user: ${result.error.message}`);
        return { success: false, error: result.error };
      }
      
      showSuccess('User created successfully');
      
      // Display generated password
      setPasswordResetUser({
        name: userData.name,
        email: userData.email
      });
      setNewPassword(result.password);
      setIsPasswordModalOpen(true);
      
      // Refresh user list
      loadUsers();
      setIsModalOpen(false);
      
      return { success: true };
    } catch (error) {
      showError('Error creating user');
      console.error('Error creating user:', error);
      return { success: false, error };
    }
  };
  
  // Handle user update
  const handleUpdateUser = async (userData) => {
    if (!selectedUser) return { success: false };
    
    try {
      const result = await userService.updateUser(selectedUser.id, userData);
      
      if (result.error) {
        showError(`Error updating user: ${result.error.message}`);
        return { success: false, error: result.error };
      }
      
      showSuccess('User updated successfully');
      
      // Refresh user list
      loadUsers();
      setIsModalOpen(false);
      
      return { success: true };
    } catch (error) {
      showError('Error updating user');
      console.error('Error updating user:', error);
      return { success: false, error };
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      
      const result = await userService.deleteUser(userId);
      
      if (result.error) {
        showError(`Error deleting user: ${result.error.message}`);
        return;
      }
      
      showSuccess('User deleted successfully');
      
      // Refresh user list
      loadUsers();
    } catch (error) {
      showError('Error deleting user');
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (user) => {
    try {
      setLoading(true);
      
      const result = await userService.resetPassword(user.id);
      
      if (result.error) {
        showError(`Error resetting password: ${result.error.message}`);
        return;
      }
      
      showSuccess('Password reset successful');
      
      // Display new password
      setPasswordResetUser(user);
      setNewPassword(result.newPassword);
      setIsPasswordModalOpen(true);
    } catch (error) {
      showError('Error resetting password');
      console.error('Error resetting password:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleFormSubmit = (userData) => {
    return formAction === 'add' 
      ? handleCreateUser(userData) 
      : handleUpdateUser(userData);
  };
  
  // Handle clipboard copy
  const handleCopyToClipboard = () => {
    try {
      navigator.clipboard.writeText(newPassword);
      showInfo('Password copied to clipboard');
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <UserList
        users={users}
        loading={loading}
        onAdd={handleAddUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onResetPassword={handleResetPassword}
      />
      
      {/* User form modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formAction === 'add' ? 'Add New User' : 'Edit User'}
        preventScroll={true}
        size="small"
      >
        <UserForm
          user={selectedUser}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          loading={loading}
        />
      </Modal>
      
      {/* Password modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Generated Password"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setIsPasswordModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="text-center mb-4">
          <div className="mb-4">
            <div className="text-lg font-semibold mb-1">
              {passwordResetUser?.name}
            </div>
            <div className="text-sm text-gray-600">
              {passwordResetUser?.email}
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <div className="text-sm text-gray-600 mb-1">Password:</div>
            <div className="font-mono text-lg font-semibold">
              {newPassword}
            </div>
          </div>
          
          <Button onClick={handleCopyToClipboard} fullWidth>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy to Clipboard
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 mt-4">
          <p className="mb-2">
            <strong>Note:</strong> This password will be shown only once. Please make sure to save it.
          </p>
          <p>
            Users can change their password after first login.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;