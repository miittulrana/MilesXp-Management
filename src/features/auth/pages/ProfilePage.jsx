import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader, CardFooter } from '../../../components/common/Card/Card';
import Input from '../../../components/common/Form/Input';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';

/**
 * User profile page component
 * @returns {JSX.Element} Profile page component
 */
const ProfilePage = () => {
  const { userDetails, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: userDetails?.name || '',
    phone: userDetails?.phone || '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  // Handle profile form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Phone validation (optional)
    if (formData.phone.trim() && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formData.phone.trim())) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle profile form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success } = await updateProfile(formData);
      
      if (success) {
        showSuccess('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success } = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (success) {
        showSuccess('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>
      
      <div className="profile-content">
        <Card className="profile-card">
          <CardHeader title="Personal Information" />
          
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Input
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                error={errors.name}
                required
              />
              
              <Input
                name="email"
                label="Email Address"
                value={userDetails?.email || ''}
                disabled
                readOnly
              />
              
              <Input
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                error={errors.phone}
              />
              
              <Input
                name="role"
                label="Role"
                value={userDetails?.role || ''}
                disabled
                readOnly
              />
              
              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
          
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePasswordSubmit}
              loading={isLoading}
              disabled={isLoading}
            >
              Change Password
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <Input
            name="currentPassword"
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Enter your current password"
            error={errors.currentPassword}
            required
          />
          
          <Input
            name="newPassword"
            type="password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            placeholder="Enter your new password"
            error={errors.newPassword}
            required
          />
          
          <Input
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            placeholder="Confirm your new password"
            error={errors.confirmPassword}
            required
          />
        </form>
      </Modal>
      
      <style jsx>{`
        .profile-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          margin-bottom: var(--spacing-lg);
        }
        
        .profile-content {
          max-width: 800px;
        }
        
        .form-actions {
          margin-top: var(--spacing-md);
        }
        
        .password-form {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;