import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import vehicleService from './vehicleService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Loader from '../../components/common/Loader/Loader';

/**
 * Vehicles Page - Simplified version
 */
const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  // Get all vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new vehicle
  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };
  
  // Handle editing a vehicle
  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };
  
  // Handle submitting vehicle form
  const handleVehicleSubmit = async (vehicleData) => {
    try {
      setLoading(true);
      
      if (selectedVehicle) {
        // Update existing vehicle
        await vehicleService.updateVehicle(selectedVehicle.id, vehicleData);
        showSuccess('Vehicle updated successfully');
      } else {
        // Add new vehicle
        await vehicleService.addVehicle(vehicleData);
        showSuccess('Vehicle added successfully');
      }
      
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showError(error.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle vehicle deletion
  const handleDeleteVehicle = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to delete ${vehicle.plate_number}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await vehicleService.deleteVehicle(vehicle.id);
      showSuccess('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle row click
  const handleRowClick = (vehicle) => {
    navigate(`${ROUTES.VEHICLES}/${vehicle.id}`);
  };
  
  return (
    <div className="vehicles-page">
      <div className="page-header">
        <h1>Vehicles</h1>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={handleAddVehicle}
          >
            Add Vehicle
          </Button>
        )}
      </div>
      
      <Card>
        <CardBody>
          {loading ? (
            <div className="loading-container">
              <Loader size="large" text="Loading vehicles..." />
            </div>
          ) : (
            <div className="vehicle-list">
              {vehicles.length === 0 ? (
                <div className="empty-state">No vehicles found</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Model</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th>Driver</th>
                      {isAdmin() && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr 
                        key={vehicle.id}
                        onClick={() => handleRowClick(vehicle)}
                        className="data-row"
                      >
                        <td>{vehicle.plate_number}</td>
                        <td>{vehicle.model}</td>
                        <td>{vehicle.year}</td>
                        <td>
                          <span className={`status-badge ${vehicle.status}`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td>{vehicle.driver_name || '-'}</td>
                        {isAdmin() && (
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditVehicle(vehicle);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVehicle(vehicle);
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
        title={selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <div className="form-container">
          <p>Vehicle form would go here. This is a simplified version.</p>
          <div className="form-actions">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleVehicleSubmit({
                plate_number: 'ABC123',
                model: 'Test Model',
                year: 2023
              })}
            >
              {selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .vehicles-page {
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
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-badge.available {
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        
        .status-badge.assigned {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
        }
        
        .status-badge.blocked {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
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

export default VehiclesPage;