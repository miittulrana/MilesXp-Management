// src/features/auth/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Input from '../../components/common/Form/Input';
import Button from '../../components/common/Button/Button';
import authService from './authService';
import { useToast } from '../../hooks/useToast';

const ProfilePage = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await authService.getUserProfile();
        setUserDetails(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        showError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await authService.updateProfile(formData);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userDetails) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      
      <Card>
        <CardHeader title="Personal Information" />
        <CardBody>
          <form onSubmit={handleSubmit}>
            <Input
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
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
                loading={loading}
                disabled={loading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProfilePage;