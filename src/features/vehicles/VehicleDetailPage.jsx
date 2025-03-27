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
import ConfirmDialog from '../../components/common/Dialog/ConfirmDialog';
import VehicleForm from './VehicleForm';

/**
 * Vehicle Detail Page
 * @returns {JSX.Element} Vehicle detail page component
 */
const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast, showError } = useToast();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const vehicleData = await vehicleService.getVehicleById(id);
        setVehicle(vehicleData);
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
        showError('Failed to load vehicle details: ' + (error.message || ''));
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
      setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  // Delete vehicle states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete dialog open
  const handleDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };
  
  // Handle delete vehicle
  const handleDeleteVehicle = async () => {
    try {
      setIsDeleting(true);
      await vehicleService.deleteVehicle(id);
      showToast('Vehicle deleted successfully', 'success');
      setIsDeleteDialogOpen(false);
      navigate(ROUTES.VEHICLES);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle vehicle assignment
  const handleAssignment = () => {
    navigate(`${ROUTES.ASSIGN_VEHICLE}?vehicleId=${id}`);
  };

  // Handle vehicle blocking
  const handleBlock = () => {
    navigate(`${ROUTES.BLOCK_VEHICLE}?vehicleId=${id}`);
  };

  // Handle service record
  const handleServiceRecord = () => {
    navigate(`${ROUTES.SERVICE_DUES}?vehicleId=${id}`);
  };

  // Handle document management
  const handleDocuments = () => {
    navigate(`${ROUTES.DOCUMENTS}?entityType=vehicle&entityId=${id}`);
  };

  // Return to vehicles list
  const handleBackClick = () => {
    navigate(ROUTES.VEHICLES);
  };

  if (loading && !vehicle) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader size="large" text="Loading vehicle details..." />
      </div>
    );
  }

  return (
    <div className="vehicle-detail-page p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={handleBackClick}
        >
          Back to Vehicles
        </Button>
        <h1 className="text-2xl font-semibold text-primary m-0">{vehicle?.plate_number || 'Vehicle Details'}</h1>
      </div>

      {vehicle && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information Card */}
          <Card>
            <CardHeader title="Vehicle Information" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Plate Number</div>
                  <div className="font-medium">{vehicle.plate_number}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Model</div>
                  <div className="font-medium">{vehicle.model}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Year</div>
                  <div className="font-medium">{vehicle.year}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <div>
                    <span className={`status-badge ${vehicle.status}`}>
                      {vehicle.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Created At</div>
                  <div className="font-medium">{formatDate(vehicle.created_at)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Updated At</div>
                  <div className="font-medium">{formatDate(vehicle.updated_at)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Driver Information Card (if assigned) */}
          <Card>
            <CardHeader title="Assigned Driver" />
            <CardBody>
              {vehicle.driver_name ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Name</div>
                    <div className="font-medium">{vehicle.driver_name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="font-medium">{vehicle.driver_email || '—'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="font-medium">{vehicle.driver_phone || '—'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No driver currently assigned to this vehicle.</div>
              )}
            </CardBody>
          </Card>

          {/* Actions Card */}
          <Card className="lg:col-span-2">
            <CardHeader title="Actions" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button 
                  variant="primary" 
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={!isAdmin()}
                >
                  Edit Vehicle
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleAssignment}
                  disabled={!isAdmin()}
                >
                  Assign Vehicle
                </Button>
                
                <Button 
                  variant="warning" 
                  onClick={handleBlock}
                  disabled={!isAdmin()}
                >
                  Block Vehicle
                </Button>
                
                <Button 
                  variant="success" 
                  onClick={handleServiceRecord}
                >
                  Add Service Record
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleDocuments}
                >
                  Manage Documents
                </Button>
                
                {isAdmin() && (
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteDialog}
                  >
                    Delete Vehicle
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Vehicle"
      >
        {vehicle && (
          <VehicleForm
            initialValues={vehicle}
            onSubmit={handleEditVehicle}
            onCancel={() => setIsEditModalOpen(false)}
            isSubmitting={isSubmitting}
            submitLabel="Update Vehicle"
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${vehicle?.plate_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default VehicleDetailPage;