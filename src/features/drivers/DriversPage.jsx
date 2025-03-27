import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import driverService from './driverService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Loader from '../../components/common/Loader/Loader';

/**
 * Drivers Page - Simplified version
 */
const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);
  
  // Get all drivers
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await driverService.getDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showError('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new driver
  const handleAddDriver = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };
  
  // Handle editing a driver
  const handleEditDriver = (driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };
  
  // Handle submitting driver form
  const handleDriverSubmit = async (driverData) => {
    try {
      setLoading(true);
      
      if (selectedDriver) {
        // Update existing driver
        await driverService.updateDriver(selectedDriver.id, driverData);
        showSuccess('Driver updated successfully');
      } else {
        // Add new driver
        await driverService.addDriver(driverData);
        showSuccess('Driver added successfully');
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
  
  // Handle driver deletion
  const handleDeleteDriver = async (driver) => {
    if (!window.confirm(`Are you sure you want to delete ${driver.name}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await driverService.deleteDriver(driver.id);
      showSuccess('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      showError(error.message || 'Failed to delete driver');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle row click
  const handleRowClick = (driver) => {
    navigate(`${ROUTES.DRIVERS}/${driver.id}`);
  };
  
  return (
    <div className="drivers-page">
      <div className="page-header">
        <h1>Drivers</h1>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={handleAddDriver}
          >
            Add Driver
          </Button>
        )}
      </div>
      
      <Card>
        <CardBody>
          {loading ? (
            <div className="loading-container">
              <Loader size="large" text="Loading drivers..." />
            </div>
          ) : (
            <div className="driver-list">
              {drivers.length === 0 ? (
                <div className="empty-state">No drivers found</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Assigned Vehicle</th>
                      {isAdmin() && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr 
                        key={driver.id}
                        onClick={() => handleRowClick(driver)}
                        className="data-row"
                      >
                        <td>{driver.name}</td>
                        <td>{driver.email}</td>
                        <td>{driver.phone || '-'}</td>
                        <td>
                          <span className="role-badge">
                            {driver.role}
                          </span>
                        </td>
                        <td>{driver.assigned_vehicle || '-'}</td>
                        {isAdmin() && (
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDriver(driver);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle reset password would go here
                                }}
                              >
                                Reset Password
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDriver(driver);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Modal form would go here - simplified for now */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDriver ? 'Edit Driver' : 'Add Driver'}
      >
        <div className="form-container">
          <p>Driver form would go here. This is a simplified version.</p>
          <div className="form-actions">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleDriverSubmit({
                name: 'Test Driver',
                email: 'test@example.com',
                phone: '123-456-7890',
                role: 'driver'
              })}
            >
              {selectedDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .drivers-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th, 
        .data-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        .data-row {
          cursor: pointer;
        }
        
        .data-row:hover {
          background-color: rgba(0, 0, 0, 0.05);
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
        
        .action-buttons {
          display: flex;
          gap: 8px;
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
        
        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default DriversPage;