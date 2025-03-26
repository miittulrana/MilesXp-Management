import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { ROUTES, VEHICLE_STATUS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader, CardFooter } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import Modal from '../../../components/common/Modal/Modal';
import VehicleForm from '../components/VehicleForm';
import ServiceForm from '../../service-dues/components/ServiceForm';
import VehicleService from '../services/vehicleService';
import DocumentService from '../../documents/services/documentService';
import ServiceService from '../../service-dues/services/serviceService';
import VehicleDetails from '../components/VehicleDetails';
import '../../../styles/global.css';

/**
 * Vehicle Detail Page Component
 * @returns {JSX.Element} Vehicle Detail page
 */
const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  
  const [vehicle, setVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Fetch vehicle details
  const fetchVehicleDetails = useCallback(async () => {
    try {
      setLoading(true);
      const vehicleData = await VehicleService.getVehicleById(id);
      setVehicle(vehicleData);
      
      // Fetch documents for this vehicle
      const vehicleDocs = await DocumentService.getDocumentsByEntity('vehicle', id);
      setDocuments(vehicleDocs);
      
      // Fetch service records
      const serviceData = await ServiceService.getServiceRecordsByVehicle(id);
      setServiceRecords(serviceData);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      showError('Failed to load vehicle details');
      navigate(ROUTES.VEHICLES);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError]);

  // Initial data fetch
  useEffect(() => {
    fetchVehicleDetails();
  }, [fetchVehicleDetails]);

  // Handle edit vehicle
  const handleEditVehicle = async (vehicleData) => {
    try {
      setLoading(true);
      await VehicleService.updateVehicle(id, vehicleData);
      showToast('Vehicle updated successfully', 'success');
      setIsEditModalOpen(false);
      await fetchVehicleDetails();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showError(error.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Handle new service record
  const handleAddServiceRecord = async (serviceData) => {
    try {
      setLoading(true);
      await ServiceService.addServiceRecord({
        ...serviceData,
        vehicle_id: id
      });
      showToast('Service record added successfully', 'success');
      setIsServiceModalOpen(false);
      await fetchVehicleDetails();
    } catch (error) {
      console.error('Error adding service record:', error);
      showError(error.message || 'Failed to add service record');
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
      await VehicleService.deleteVehicle(id);
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

  // Navigate to assign vehicle page
  const handleAssignClick = () => {
    navigate(`${ROUTES.ASSIGN_VEHICLE}?vehicleId=${id}`);
  };

  // Navigate to block vehicle page
  const handleBlockClick = () => {
    navigate(`${ROUTES.BLOCK_VEHICLE}?vehicleId=${id}`);
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
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          }
        >
          Back to Vehicles
        </Button>
        <h1>{vehicle?.plate_number} Details</h1>
      </div>

      {vehicle && (
        <>
          <div className="vehicle-detail-content">
            <VehicleDetails 
              vehicle={vehicle} 
              documents={documents} 
              serviceRecords={serviceRecords}
            />
            
            <div className="vehicle-actions">
              <Card>
                <CardHeader title="Actions" />
                <CardBody>
                  <div className="actions-grid">
                    <Button 
                      variant="primary" 
                      onClick={() => setIsEditModalOpen(true)}
                      disabled={!isAdmin()}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      }
                    >
                      Edit Vehicle
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      onClick={handleAssignClick}
                      disabled={!isAdmin() || vehicle.status === VEHICLE_STATUS.BLOCKED}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="20" y1="8" x2="20" y2="14"></line>
                          <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                      }
                    >
                      Assign Vehicle
                    </Button>
                    
                    <Button 
                      variant="warning" 
                      onClick={handleBlockClick}
                      disabled={!isAdmin() || vehicle.status === VEHICLE_STATUS.BLOCKED}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                      }
                    >
                      Block Vehicle
                    </Button>
                    
                    <Button 
                      variant="success" 
                      onClick={() => setIsServiceModalOpen(true)}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      }
                    >
                      Add Service Record
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`${ROUTES.DOCUMENTS}?entityType=vehicle&entityId=${id}`)}
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
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`${ROUTES.VEHICLE_LOGS}?vehicleId=${id}`)}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
                          <line x1="9" y1="9" x2="10" y2="9"></line>
                          <line x1="9" y1="13" x2="15" y2="13"></line>
                          <line x1="9" y1="17" x2="15" y2="17"></line>
                        </svg>
                      }
                    >
                      View Vehicle Logs
                    </Button>
                    
                    {isAdmin() && (
                      <Button 
                        variant="danger" 
                        onClick={handleDeleteVehicle}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        }
                      >
                        Delete Vehicle
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Edit Vehicle Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Vehicle"
            size="medium"
          >
            <VehicleForm
              vehicle={vehicle}
              onSubmit={handleEditVehicle}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </Modal>

          {/* Add Service Record Modal */}
          <Modal
            isOpen={isServiceModalOpen}
            onClose={() => setIsServiceModalOpen(false)}
            title="Add Service Record"
            size="medium"
          >
            <ServiceForm
              vehicle={vehicle}
              onSubmit={handleAddServiceRecord}
              onCancel={() => setIsServiceModalOpen(false)}
            />
          </Modal>
        </>
      )}
      
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
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--spacing-md);
        }
        
        .actions-grid {
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
        
        @media (max-width: 992px) {
          .vehicle-detail-content {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default VehicleDetailPage;