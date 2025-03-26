import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { ROUTES, ENTITY_TYPES } from '../../../lib/constants';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import Modal from '../../../components/common/Modal/Modal';
import DriverDetails from '../components/DriverDetails';
import DriverForm from '../components/DriverForm';
import DriverService from '../services/driverService';
import DocumentService from '../../documents/services/documentService';

/**
 * Driver Detail Page component
 * @returns {JSX.Element} Driver detail page
 */
const DriverDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Fetch driver details
  const fetchDriverDetails = useCallback(async () => {
    try {
      setLoading(true);
      const driverData = await DriverService.getDriverById(id);
      setDriver(driverData);
      
      // Fetch documents for this driver
      const driverDocs = await DocumentService.getDocumentsByEntity(ENTITY_TYPES.DRIVER, id);
      setDocuments(driverDocs);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      showError('Failed to load driver details');
      navigate(ROUTES.DRIVERS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError]);
  
  // Initial data fetch
  useEffect(() => {
    fetchDriverDetails();
  }, [fetchDriverDetails]);
  
  // Handle edit driver
  const handleEditDriver = async (driverData) => {
    try {
      setLoading(true);
      await DriverService.updateDriver(id, driverData);
      showToast('Driver updated successfully', 'success');
      setIsEditModalOpen(false);
      
      // If password was updated, show it
      if (driverData.password) {
        setNewPassword(driverData.password);
        setIsPasswordModalOpen(true);
      }
      
      await fetchDriverDetails();
    } catch (error) {
      console.error('Error updating driver:', error);
      showError(error.message || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle manual password reset
  const handleResetPassword = async () => {
    try {
      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      setLoading(true);
      await DriverService.resetPassword(id, randomPassword);
      setNewPassword(randomPassword);
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
      await DriverService.deleteDriver(id);
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
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          }
        >
          Back to Drivers
        </Button>
        <h1>{driver?.name}</h1>
      </div>
      
      {driver && (
        <>
          <div className="driver-detail-content">
            <DriverDetails driver={driver} documents={documents} />
            
            <div className="driver-actions">
              <div className="action-card">
                <h3 className="action-header">Actions</h3>
                <div className="action-buttons">
                  {isAdmin() && (
                    <>
                      <Button 
                        variant="primary" 
                        onClick={() => setIsEditModalOpen(true)}
                        className="action-button"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        }
                      >
                        Edit Driver
                      </Button>
                      
                      <Button 
                        variant="secondary" 
                        onClick={handleResetPassword}
                        className="action-button"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        }
                      >
                        Reset Password
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`${ROUTES.DOCUMENTS}?entityType=driver&entityId=${id}`)}
                    className="action-button"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    }
                  >
                    Manage Documents
                  </Button>
                  
                  {isAdmin() && !driver.assigned_vehicle_id && (
                    <Button 
                      variant="success" 
                      onClick={() => navigate(`${ROUTES.ASSIGN_VEHICLE}?driverId=${id}`)}
                      className="action-button"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                      }
                    >
                      Assign Vehicle
                    </Button>
                  )}
                  
                  {isAdmin() && (
                    <Button 
                      variant="danger" 
                      onClick={handleDeleteDriver}
                      className="action-button"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      }
                    >
                      Delete Driver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Edit Driver Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Driver"
            size="medium"
          >
            <DriverForm
              driver={driver}
              onSubmit={handleEditDriver}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </Modal>
          
          {/* Password Reset Modal */}
          <Modal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            title="Password Reset"
            size="small"
          >
            <div className="password-notice">
              <div className="password-notice-header">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <h3>Password Reset Successful</h3>
              </div>
              <p>The new password for {driver.name} is:</p>
              <div className="password-display">
                <code>{newPassword}</code>
              </div>
              <p className="password-instructions">
                Please share this password with the driver. They should change it upon login.
              </p>
              <div className="password-actions">
                <button
                  className="copy-button"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    showToast('Password copied to clipboard', 'success');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy to Clipboard
                </button>
                <button 
                  className="close-button"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
      
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
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--spacing-md);
        }
        
        .action-card {
          background-color: var(--background-color);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }
        
        .action-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          background-color: var(--surface-color);
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .action-buttons {
          padding: var(--spacing-md);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }
        
        .page-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }
        
        .password-notice {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .password-notice-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: var(--spacing-md);
          color: var(--success-color);
        }
        
        .password-notice-header svg {
          margin-bottom: var(--spacing-sm);
          color: var(--primary-color);
        }
        
        .password-notice-header h3 {
          margin: 0;
          color: var(--primary-color);
        }
        
        .password-display {
          margin: var(--spacing-md) 0;
          padding: var(--spacing-md);
          background-color: var(--surface-color);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
          font-size: var(--font-size-lg);
          font-weight: 500;
          width: 100%;
          word-break: break-all;
        }
        
        .password-display code {
          font-family: monospace;
        }
        
        .password-instructions {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
        }
        
        .password-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }
        
        .copy-button, .close-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 0.5rem 1rem;
          border-radius: var(--border-radius-md);
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color var(--transition-fast) ease;
        }
        
        .copy-button {
          background-color: var(--primary-color);
          color: white;
        }
        
        .copy-button:hover {
          background-color: #003d80;
        }
        
        .close-button {
          background-color: var(--surface-color);
          border: 1px solid var(--border-color);
        }
        
        .close-button:hover {
          background-color: var(--border-color);
        }
        
        @media (max-width: 992px) {
          .driver-detail-content {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DriverDetailPage;