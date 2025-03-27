import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import vehicleService from './vehicleService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../lib/utils';

// Core UI components
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Loader from '../../components/common/Loader/Loader';
import DataTable from '../../components/common/DataTable/DataTable';
import ConfirmDialog from '../../components/common/Dialog/ConfirmDialog';
import VehicleForm from './VehicleForm';

/**
 * Vehicles Page component
 * @returns {JSX.Element} Vehicles page
 */
const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
      showError('Failed to load vehicles. ' + (error.message || ''));
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
      setIsSubmitting(true);
      
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
      setIsSubmitting(false);
    }
  };
  
  // Vehicle deletion states
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle delete dialog open
  const handleDeleteDialog = (vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle vehicle deletion
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    try {
      setIsDeleting(true);
      await vehicleService.deleteVehicle(vehicleToDelete.id);
      showSuccess('Vehicle deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle row click to navigate to vehicle details
  const handleRowClick = (vehicle) => {
    navigate(`${ROUTES.VEHICLES}/${vehicle.id}`);
  };
  
  // Table columns configuration
  const columns = [
    {
      field: 'plate_number',
      title: 'Plate Number',
      sortable: true
    },
    {
      field: 'model',
      title: 'Model',
      sortable: true
    },
    {
      field: 'year',
      title: 'Year',
      sortable: true
    },
    {
      field: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value}`}>
          {value}
        </span>
      )
    },
    {
      field: 'driver_name',
      title: 'Assigned To',
      sortable: true,
      render: (value) => value || '—'
    },
    {
      field: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => formatDate(value)
    }
  ];
  
  // Add actions column if user is admin
  if (isAdmin()) {
    columns.push({
      field: 'actions',
      title: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEditVehicle(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDialog(row);
            }}
          >
            Delete
          </Button>
        </div>
      )
    });
  }
  
  // Search fields configuration
  const searchFields = ['plate_number', 'model', 'driver_name', 'status'];
  
  return (
    <div className="vehicles-page p-4">
      <div className="page-header flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">Vehicles</h1>
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
        <CardHeader title="Vehicle List" />
        <CardBody>
          {loading && vehicles.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader size="large" text="Loading vehicles..." />
            </div>
          ) : (
            <DataTable
              data={vehicles}
              columns={columns}
              onRowClick={handleRowClick}
              pagination={true}
              pageSize={10}
              searchable={true}
              searchPlaceholder="Search vehicles..."
              searchFields={searchFields}
              sortable={true}
              defaultSortField="plate_number"
              loading={loading}
              emptyMessage="No vehicles found"
              rowClassName="cursor-pointer"
            />
          )}
        </CardBody>
      </Card>
      
      {/* Add/Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <VehicleForm
          initialValues={selectedVehicle || {}}
          onSubmit={handleVehicleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
          submitLabel={selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
        />
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${vehicleToDelete?.plate_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default VehiclesPage;