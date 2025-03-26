import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../lib/constants';
import Card from '../../../components/common/Card/Card';
import { CardBody } from '../../../components/common/Card/Card';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import DriverList from '../components/DriverList';
import DriverForm from '../components/DriverForm';
import DriverService from '../services/driverService';

/**
 * Drivers page component for managing drivers
 * @returns {JSX.Element} Drivers page component
 */
const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  const navigate = useNavigate();
  
  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DriverService.getDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showError('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [showError]);
  
  // Initial fetch
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);
  
  // Handle adding a new driver
  const handleAddDriver = () => {
    if (!isAdmin()) {
      showError('Only admins can add drivers');
      return;
    }
    
    setSelectedDriver(null);
    setIsModalOpen(true);
  };
  
  // Handle editing a driver
  const handleEditDriver = (driver) => {
    if (!isAdmin()) {
      showError('Only admins can edit drivers');
      return;
    }
    
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };
  
  // Handle driver form submission
  const handleDriverSubmit = async (driverData) => {
    try {
      setLoading(true);
      
      if (selectedDriver) {
        // Update existing driver
        await DriverService.updateDriver(selectedDriver.id, driverData);
        showToast('Driver updated successfully', 'success');
      } else {
        // Add new driver
        const result = await DriverService.addDriver(driverData);
        setNewPassword(result.password);
        showToast('Driver added successfully', 'success');
      }
      
      setIsModalOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      showError(error.message || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting a driver
  const handleDeleteDriver = async (driver) => {
    if (!isAdmin()) {
      showError('Only admins can delete drivers');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${driver.name}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await DriverService.deleteDriver(driver.id);
      showToast('Driver deleted successfully', 'success');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      showError(error.message || 'Failed to delete driver');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle row click to navigate to driver details
  const handleRowClick = (driver) => {
    navigate(`${ROUTES.DRIVERS}/${driver.id}`);
  };
  
  // Close modal and reset new password
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewPassword('');
  };
  
  return (
    <div className="drivers-page">
      <Card>
        <CardBody>
          {loading && drivers.length === 0 ? (
            <div className="loading-container">
              <Loader size="large" text="Loading drivers..." />
            </div>
          ) : (
            <DriverList
              drivers={drivers}
              loading={loading}
              onAddDriver={handleAddDriver}
              onEditDriver={handleEditDriver}
              onDeleteDriver={handleDeleteDriver}
              onRowClick={handleRowClick}
            />
          )}
        </CardBody>
      </Card>
      
      {/* Driver Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedDriver ? 'Edit Driver' : 'Add Driver'}
        size="medium"
      >
        {newPassword ? (
          <div className="password-notice">
            <div className="password-notice-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
              </svg>
              <h3>Driver Added Successfully</h3>
            </div>
            <p>Please note down the temporary password for the driver:</p>
            <div className="password-display">
              <code>{newPassword}</code>
            </div>
            <p className="password-instructions">
              The driver will be able to log in with this password and should change it upon first login.
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
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <DriverForm
            driver={selectedDriver}
            onSubmit={handleDriverSubmit}
            onCancel={handleCloseModal}
          />
        )}
      </Modal>
      
      <style jsx>{`
        .drivers-page {
          padding: var(--spacing-md);
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
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
        }
        
        .password-notice-header h3 {
          margin: 0;
          color: var(--success-color);
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
          max-width: 400px;
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
      `}</style>
    </div>
  );
};

export default DriversPage;