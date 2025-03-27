import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';
import driverService from './driverService';
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
import DriverForm from './DriverForm';
import ConfirmDialog from '../../components/common/Dialog/ConfirmDialog';

/**
 * Drivers Page component
 */
const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      showError('Failed to load drivers. ' + (error.message || ''));
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
      setIsSubmitting(true);
      
      if (selectedDriver) {
        // Update existing driver
        await driverService.updateDriver(selectedDriver.id, driverData);
        showSuccess('Driver updated successfully');
      } else {
        // Add new driver
        const result = await driverService.addDriver(driverData);
        if (result && result.password) {
          setNewPassword(result.password);
          setIsPasswordModalOpen(true);
        }
        showSuccess('Driver added successfully');
      }
      
      setIsModalOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      showError(error.message || 'Failed to save driver');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a driver
  const handleDeleteClick = (driver) => {
    setDriverToDelete(driver);
    setIsDeleteDialogOpen(true);
  };
  
  // Execute driver deletion
  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    
    try {
      setIsDeleting(true);
      await driverService.deleteDriver(driverToDelete.id);
      showSuccess('Driver deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      showError(error.message || 'Failed to delete driver');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (driverId) => {
    try {
      setLoading(true);
      const result = await driverService.resetPassword(driverId);
      
      if (result.isEmail) {
        showSuccess('Password reset email sent successfully');
      } else if (result.newPassword) {
        setNewPassword(result.newPassword);
        setIsPasswordModalOpen(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle copy password to clipboard
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    showSuccess('Password copied to clipboard');
  };
  
  // Handle row click
  const handleRowClick = (driver) => {
    navigate(`${ROUTES.DRIVERS}/${driver.id}`);
  };
  
  // Table columns configuration
  const columns = [
    {
      field: 'name',
      title: 'Name',
      sortable: true
    },
    {
      field: 'email',
      title: 'Email',
      sortable: true
    },
    {
      field: 'phone',
      title: 'Phone',
      sortable: false,
      render: (value) => value || '-'
    },
    {
      field: 'assigned_vehicle',
      title: 'Assigned Vehicle',
      sortable: true,
      render: (value) => value || '-'
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
              handleEditDriver(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleResetPassword(row.id);
            }}
          >
            Reset Password
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            Delete
          </Button>
        </div>
      )
    });
  }
  
  return (
    <div className="drivers-page p-4">
      <div className="page-header flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">Drivers</h1>
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
        <CardHeader title="Driver List" />
        <CardBody>
          {loading && drivers.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader size="large" text="Loading drivers..." />
            </div>
          ) : (
            <DataTable
              data={drivers}
              columns={columns}
              onRowClick={handleRowClick}
              pagination={true}
              pageSize={10}
              searchable={true}
              searchPlaceholder="Search drivers..."
              searchFields={['name', 'email', 'phone']}
              sortable={true}
              defaultSortField="name"
              loading={loading}
              emptyMessage="No drivers found"
              rowClassName="cursor-pointer"
            />
          )}
        </CardBody>
      </Card>
      
      {/* Add/Edit Driver Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={selectedDriver ? 'Edit Driver' : 'Add Driver'}
      >
        <div className="p-4">
          <DriverForm
            initialValues={selectedDriver || {}}
            onSubmit={handleDriverSubmit}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={isSubmitting}
            submitLabel={selectedDriver ? 'Update Driver' : 'Add Driver'}
            isEditMode={!!selectedDriver}
          />
        </div>
      </Modal>
      
      {/* Password Display Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="New Password"
      >
        <div className="p-4">
          <p className="mb-4">A new password has been generated. Please save it as you won't be able to see it again:</p>
          
          <div className="bg-gray-100 p-3 rounded border mb-4 font-mono text-center break-all">
            {newPassword}
          </div>
          
          <Button
            variant="primary"
            onClick={handleCopyPassword}
            fullWidth
          >
            Copy to Clipboard
          </Button>
        </div>
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteDriver}
        title="Delete Driver"
        message={`Are you sure you want to delete driver ${driverToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DriversPage;