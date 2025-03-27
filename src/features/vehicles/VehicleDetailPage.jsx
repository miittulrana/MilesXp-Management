import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../lib/utils';
import vehicleService from './vehicleService';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import Modal from '../../components/common/Modal/Modal';

/**
 * Vehicle Detail Page - Simplified version
 */
const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const vehicleData = await vehicleService.getVehicleById(id);
        setVehicle(vehicleData);
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
        showError('Failed to load vehicle details');
        navigate(ROUTES.VEHICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id, navigate, showError]);

  // Handle edit vehicle
  const handleEditVehicle = async (vehicleData) => {
    try {
      setLoading(true);
      await vehicleService.updateVehicle(id, vehicleData);
      showToast('Vehicle updated successfully', 'success');
      setIsEditModalOpen(false);
      
      // Refresh vehicle data
      const updatedVehicle = await vehicleService.getVehicleById(id);
      setVehicle(updatedVehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showError(error.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async () => {
    if (!window.confirm(`Are you sure you want to delete ${vehicle?.plate_number}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await vehicleService.deleteVehicle(id);
      showToast('Vehicle deleted successfully', 'success');
      navigate(ROUTES.VEHICLES);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Return to vehicles list
  const handleBackClick = () => {
    navigate(ROUTES.VEHICLES);
  };

  if (loading && !vehicle) {
    return (
      <div className="page-loading">
        <Loader size="large" text="Loading vehicle details..." />
      </div>
    );
  }

  return (
    <div className="vehicle-detail-page">
      <div className="page-header">
        <Button 
          variant="outline" 
          onClick={handleBackClick}
        >
          Back to Vehicles
        </Button>
        <h1>{vehicle?.plate_number} Details</h1>
      </div>

      {vehicle && (
        <div className="vehicle-detail-content">
          {/* Vehicle Information Card */}
          <Card>
            <CardHeader title="Vehicle Information" />
            <CardBody>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Plate Number</div>
                  <div className="info-value">{vehicle.plate_number}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Model</div>
                  <div className="info-value">{vehicle.model}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Year</div>
                  <div className="info-value">{vehicle.year}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Status</div>
                  <div className="info-value">
                    <span className={`status-badge ${vehicle.status}`}>
                      {vehicle.status}
                    </span>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Created At</div>
                  <div className="info-value">{formatDate(vehicle.created_at)}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Updated At</div>
                  <div className="info-value">{formatDate(vehicle.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Driver Information Card (if assigned) */}
          {vehicle.driver_name && (
            <Card className="card-section">
              <CardHeader title="Assigned Driver" />
              <CardBody>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Name</div>
                    <div className="info-value">{vehicle.driver_name}</div>
                  </div>
                  
                  {vehicle.driver_email && (
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{vehicle.driver_email}</div>
                    </div>
                  )}
                  
                  {vehicle.driver_phone && (
                    <div className="info-item">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{vehicle.driver_phone}</div>
                    </div>
                  )}
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
                  Edit Vehicle
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={() => navigate(`${ROUTES.ASSIGN_VEHICLE}?vehicleId=${id}`)}
                  disabled={!isAdmin()}
                >
                  Assign Vehicle
                </Button>
                
                <Button 
                  variant="warning" 
                  onClick={() => navigate(`${ROUTES.BLOCK_VEHICLE}?vehicleId=${id}`)}
                  disabled={!isAdmin()}
                >
                  Block Vehicle
                </Button>
                
                <Button 
                  variant="success" 
                  onClick={() => navigate(`${ROUTES.SERVICE_DUES}?vehicleId=${id}`)}
                >
                  Add Service Record
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`${ROUTES.DOCUMENTS}?entityType=vehicle&entityId=${id}`)}
                >
                  Manage Documents
                </Button>
                
                {isAdmin() && (
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteVehicle}
                  >
                    Delete Vehicle
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
        title="Edit Vehicle"
      >
        <div className="form-container">
          <p>Vehicle edit form would go here. This is a simplified version.</p>
          <div className="form-actions">
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleEditVehicle({
                plate_number: vehicle?.plate_number,
                model: vehicle?.model,
                year: vehicle?.year
              })}
            >
              Update Vehicle
            </Button>
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .vehicle-detail-page {
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
        
        .vehicle-detail-content {
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

export default VehicleDetailPage;