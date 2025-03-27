import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/utils';
import driverService from './driverService';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import Modal from '../../components/common/Modal/Modal';

/**
 * Driver Detail Page - Simplified version
 */
const DriverDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Fetch driver details
  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        setLoading(true);
        const driverData = await driverService.getDriverById(id);
        setDriver(driverData);
      } catch (error) {
        console.error('Error fetching driver details:', error);
        showError('Failed to load driver details');
        navigate(ROUTES.DRIVERS);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverDetails();
  }, [id, navigate, showError]);

  // Handle edit driver
  const handleEditDriver = async (driverData) => {
    try {
      setLoading(true);
      await driverService.updateDriver(id, driverData);
      showToast('Driver updated successfully', 'success');
      setIsEditModalOpen(false);
      
      // Refresh driver data
      const updatedDriver = await driverService.getDriverById(id);
      setDriver(updatedDriver);
    } catch (error) {
      console.error('Error updating driver:', error);
      showError(error.message || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const result = await driverService.resetPassword(id);
      setNewPassword(result.newPassword);
      setIsPasswordModalOpen(true);
      showToast('Password reset successfully', 'success');
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete driver
  const handleDeleteDriver = async () => {
    if (!window.confirm(`Are you sure you want to delete ${driver?.name}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await driverService.deleteDriver(id);
      showToast('Driver deleted successfully', 'success');
      navigate(ROUTES.DRIVERS);
    } catch (error) {
      console.error('Error deleting driver:', error);
      showError(error.message || 'Failed to delete driver');
    } finally {
      setLoading(false);
    }
  };

  // Return to drivers list
  const handleBackClick = () => {
    navigate(ROUTES.DRIVERS);
  };

  // Handle clipboard copy
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    showToast('Password copied to clipboard', 'info');
  };

  if (loading && !driver) {
    return (
      <div className="page-loading">
        <Loader size="large" text="Loading driver details..." />
      </div>
    );
  }

  return (
    <div className="driver-detail-page">
      <div className="page-header">
        <Button 
          variant="outline" 
          onClick={handleBackClick}
        >
          Back to Drivers
        </Button>
        <h1>{driver?.name}</h1>
      </div>

      {driver && (
        <div className="driver-detail-content">
          {/* Driver Information Card */}
          <Card>
            <CardHeader title="Driver Information" />
            <CardBody>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Name</div>
                  <div className="info-value">{driver.name}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{driver.email}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Phone</div>
                  <div className="info-value">{driver.phone || '-'}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Role</div>
                  <div className="info-value">
                    <span className="role-badge">
                      {driver.role}
                    </span>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Created At</div>
                  <div className="info-value">{formatDate(driver.created_at)}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Updated At</div>
                  <div className="info-value">{formatDate(driver.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vehicle Information Card (if assigned) */}
          {driver.assigned_vehicle && (
            <Card className="card-section">
              <CardHeader title="Assigned Vehicle" />
              <CardBody>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Vehicle</div>
                    <div className="info-value">{driver.assigned_vehicle}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Actions Card */}
          <Card className="card-section">
            <CardHeader title="Actions" />
            <CardBody>
              <div className="actions-grid">
                <Button 
                  variant="primary" 
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={!isAdmin()}
                >
                  Edit Driver
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleResetPassword}
                  disabled={!isAdmin()}
                >
                  Reset Password
                </Button>
                
                <Button 
                  variant="success" 
                  onClick={() => navigate(`${ROUTES.ASSIGN_VEHICLE}?driverId=${id}`)}
                  disabled={!isAdmin()}
                >
                  Assign Vehicle
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`${ROUTES.DOCUMENTS}?entityType=driver&entityId=${id}`)}
                >
                  Manage Documents
                </Button>
                
                {isAdmin() && (
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteDriver}
                  >
                    Delete Driver
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Edit Modal - Simplified */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Driver"
      >
        <div className="form-container">
          <p>Driver edit form would go here. This is a simplified version.</p>
          <div className="form-actions">
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleEditDriver({
                name: driver?.name,
                phone: driver?.phone
              })}
            >
              Update Driver
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Password Reset"
      >
        <div className="password-container">
          <div className="password-header">
            <h3>New Password Generated</h3>
            <p>Password for {driver?.name} has been reset to:</p>
          </div>
          
          <div className="password-display">
            {newPassword}
          </div>
          
          <p className="password-notice">
            This password will only be shown once. Please save it or share it with the driver.
          </p>
          
          <Button 
            variant="primary" 
            onClick={handleCopyToClipboard}
            fullWidth
          >
            Copy to Clipboard
          </Button>
        </div>
      </Modal>
      
      <style jsx>{`
        .driver-detail-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .page-header h1 {
          margin-bottom: 0;
          font-size: var(--font-size-2xl);
          color: var(--primary-color);
        }
        
        .driver-detail-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .card-section {
          margin-top: var(--spacing-md);
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }
        
        .info-item {
          padding-bottom: var(--spacing-sm);
        }
        
        .info-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        
        .info-value {
          font-weight: 500;
        }
        
        .role-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
          text-transform: capitalize;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }
        
        .form-container {
          padding: 16px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
        }
        
        .page-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }
        
        .password-container {
          padding: 16px;
          text-align: center;
        }
        
        .password-header {
          margin-bottom: 16px;
        }
        
        .password-header h3 {
          margin-bottom: 8px;
          color: var(--primary-color);
        }
        
        .password-display {
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 12px;
          margin: 16px 0;
          font-family: monospace;
          font-size: 18px;
          word-break: break-all;
          font-weight: 600;
        }
        
        .password-notice {
          margin-bottom: 16px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DriverDetailPage;