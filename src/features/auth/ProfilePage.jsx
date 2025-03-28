import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/utils';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Form/Input';
import Loader from '../../components/common/Loader/Loader';

/**
 * User Profile Page
 */
const ProfilePage = () => {
  const { user, userDetails, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: ''
  });

  // Load user data
  useEffect(() => {
    if (userDetails) {
      setProfileData({
        name: userDetails.name || '',
        phone: userDetails.phone || ''
      });
    }
  }, [userDetails]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateProfile(profileData);
      showSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Reset form when canceling edit
      setProfileData({
        name: userDetails.name || '',
        phone: userDetails.phone || ''
      });
    }
    setIsEditing(!isEditing);
  };

  if (!user || !userDetails) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader size="large" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="profile-page p-4">
      <h1 className="text-2xl font-semibold text-primary mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information Card */}
        <Card className="md:col-span-2">
          <CardHeader 
            title="Profile Information"
            action={
              <Button
                variant="outline"
                size="small"
                onClick={toggleEditMode}
                disabled={loading}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            }
          />
          <CardBody>
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    label="Email"
                    value={userDetails.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                  
                  <Input
                    label="Phone"
                    name="phone"
                    value={profileData.phone || ''}
                    onChange={handleChange}
                    helperText="Optional"
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div className="font-medium">{userDetails.name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="font-medium">{userDetails.email}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Phone</div>
                  <div className="font-medium">{userDetails.phone || '—'}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Role</div>
                  <div className="font-medium">
                    <span className="role-badge">
                      {userDetails.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader title="Account Information" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Account ID</div>
                <div className="font-medium text-xs break-all">{userDetails.id}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Created</div>
                <div className="font-medium">{formatDate(userDetails.created_at)}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                <div className="font-medium">{formatDate(userDetails.updated_at)}</div>
              </div>
              
              <div className="pt-4 border-t border-border-color">
                <p className="text-sm text-gray-500 mb-2">Password Management</p>
                <p className="text-sm mb-2">
                  To reset your password, please contact your administrator.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <style jsx>{`
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
          background-color: rgba(0, 77, 153, 0.1);
          color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;