import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import VehicleList from '../components/VehicleList';
import VehicleForm from '../components/VehicleForm';
import VehicleService from '../services/vehicleService';

/**
 * Vehicles page component
 * @returns {JSX.Element} Vehicles page component
 */
const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Fetch vehicles
  const fetchVehicles = useCallback(async (searchTerm = '') => {
    try {
      setLoading(true);
      let data;
      
      if (searchTerm) {
        data = await VehicleService.searchVehicles(searchTerm);
      } else {
        data = await VehicleService.getVehicles();
      }
      
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [showError]);
  
  // Initial fetch
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);
  
  // Handle add vehicle
  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };
  
  // Handle edit vehicle
  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };
  
  // Handle vehicle form submit
  const handleVehicleSubmit = async (vehicleData) => {
    try {
      setLoading(true);
      
      if (selectedVehicle) {
        // Update existing vehicle
        await VehicleService.updateVehicle(selectedVehicle.id, vehicleData);
        showSuccess('Vehicle updated successfully');
      } else {
        // Add new vehicle
        await VehicleService.addVehicle(vehicleData);
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
  
  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to delete ${vehicle.plate_number}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await VehicleService.deleteVehicle(vehicle.id);
      showSuccess('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = async (searchTerm) => {
    fetchVehicles(searchTerm);
  };
  
  return (
    <div className="vehicles-page">
      <div className="page-header">
        <h1>Vehicles</h1>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={handleAddVehicle}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            }
          >
            Add Vehicle
          </Button>
        )}
      </div>
      
      <div className="vehicles-content">
        <VehicleList 
          vehicles={vehicles}
          loading={loading}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
          onSearch={handleSearch}
          isAdmin={isAdmin()}
        />
      </div>
      
      {/* Vehicle Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <VehicleForm
          vehicle={selectedVehicle}
          onSubmit={handleVehicleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={loading}
        />
      </Modal>
      
      <style jsx>{`
        .vehicles-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }
        
        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

export default VehiclesPage;