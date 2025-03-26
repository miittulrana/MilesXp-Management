import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import ServiceList from '../components/ServiceList';
import ServiceForm from '../components/ServiceForm';
import ServiceService from '../services/serviceService';
import VehicleService from '../../vehicles/services/vehicleService';

/**
 * Service Dues Page component
 * @returns {JSX.Element} Service dues page
 */
const ServiceDuesPage = () => {
  const [serviceRecords, setServiceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const { showToast, showError } = useToast();
  const location = useLocation();
  
  // Parse query params for vehicle filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const vehicleId = searchParams.get('vehicleId');
    
    if (vehicleId) {
      setVehicleFilter(vehicleId);
      
      // Fetch the vehicle details for the selected filter
      const getVehicle = async () => {
        try {
          const vehicle = await VehicleService.getVehicleById(vehicleId);
          setSelectedVehicle(vehicle);
        } catch (error) {
          console.error('Error fetching vehicle:', error);
        }
      };
      
      getVehicle();
    }
  }, [location.search]);
  
  // Fetch service records
  const fetchServiceRecords = useCallback(async () => {
    try {
      setLoading(true);
      let records;
      
      if (vehicleFilter) {
        // Fetch records for specific vehicle
        records = await ServiceService.getServiceRecordsByVehicle(vehicleFilter);
      } else {
        // Fetch all records
        records = await ServiceService.getServiceRecords();
      }
      
      setServiceRecords(records);
    } catch (error) {
      console.error('Error fetching service records:', error);
      showError('Failed to load service records');
    } finally {
      setLoading(false);
    }
  }, [vehicleFilter, showError]);
  
  // Fetch vehicles for dropdown
  const fetchVehicles = useCallback(async () => {
    try {
      const data = await VehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchServiceRecords();
    fetchVehicles();
  }, [fetchServiceRecords, fetchVehicles]);
  
  // Handle add service record
  const handleAddService = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };
  
  // Handle edit service record
  const handleEditService = (record) => {
    setSelectedRecord(record);
    
    // If a vehicle is needed for the form
    if (record.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === record.vehicle_id);
      setSelectedVehicle(vehicle || null);
    }
    
    setIsModalOpen(true);
  };
  
  // Handle service form submit
  const handleServiceSubmit = async (serviceData) => {
    try {
      setLoading(true);
      
      if (selectedRecord) {
        // Update existing record
        await ServiceService.updateServiceRecord(selectedRecord.id, serviceData);
        showToast('Service record updated successfully', 'success');
      } else {
        // Add new record using the selected vehicle
        if (!selectedVehicle) {
          throw new Error('Please select a vehicle');
        }
        
        await ServiceService.addServiceRecord({
          ...serviceData,
          vehicle_id: selectedVehicle.id
        });
        showToast('Service record added successfully', 'success');
      }
      
      setIsModalOpen(false);
      fetchServiceRecords();
    } catch (error) {
      console.error('Error saving service record:', error);
      showError(error.message || 'Failed to save service record');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete service record
  const handleDeleteService = async (record) => {
    if (!window.confirm(`Are you sure you want to delete this service record?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await ServiceService.deleteServiceRecord(record.id);
      showToast('Service record deleted successfully', 'success');
      fetchServiceRecords();
    } catch (error) {
      console.error('Error deleting service record:', error);
      showError(error.message || 'Failed to delete service record');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle vehicle filter change
  const handleVehicleFilterChange = (e) => {
    const vehicleId = e.target.value;
    setVehicleFilter(vehicleId);
    
    // Update the URL to reflect the filter
    const url = new URL(window.location);
    if (vehicleId) {
      url.searchParams.set('vehicleId', vehicleId);
    } else {
      url.searchParams.delete('vehicleId');
    }
    window.history.pushState({}, '', url);
    
    // Update selected vehicle for form
    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
  };
  
  // Filter for showing dued soon at the top
  const sortedServiceRecords = [...serviceRecords].sort((a, b) => {
    // First sort by status priority
    const statusPriority = { overdue: 0, due_soon: 1, completed: 2 };
    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by km remaining
    const aRemaining = a.next_service_km - a.current_km;
    const bRemaining = b.next_service_km - b.current_km;
    return aRemaining - bRemaining;
  });
  
  return (
    <div className="service-dues-page">
      <div className="page-header">
        <h1>Service Records</h1>
        
        <div className="filter-section">
          <label htmlFor="vehicle-filter">Filter by Vehicle:</label>
          <select
            id="vehicle-filter"
            value={vehicleFilter}
            onChange={handleVehicleFilterChange}
            className="vehicle-filter"
          >
            <option value="">All Vehicles</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate_number} - {vehicle.model}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {vehicleFilter && selectedVehicle && (
        <Card className="vehicle-info-card">
          <CardHeader title={`Vehicle: ${selectedVehicle.plate_number}`} />
          <CardBody>
            <div className="vehicle-info">
              <div className="info-item">
                <span className="info-label">Model:</span>
                <span className="info-value">{selectedVehicle.model}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Year:</span>
                <span className="info-value">{selectedVehicle.year}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  <span className={`badge badge-${selectedVehicle.status.toLowerCase()}`}>
                    {selectedVehicle.status}
                  </span>
                </span>
              </div>
              {selectedVehicle.driver_name && (
                <div className="info-item">
                  <span className="info-label">Driver:</span>
                  <span className="info-value">{selectedVehicle.driver_name}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
      
      <Card>
        <CardBody>
          {loading && serviceRecords.length === 0 ? (
            <div className="loading-container">
              <Loader size="large" text="Loading service records..." />
            </div>
          ) : (
            <ServiceList
              serviceRecords={sortedServiceRecords}
              loading={loading}
              onAddService={handleAddService}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              showVehicleInfo={!vehicleFilter}
            />
          )}
        </CardBody>
      </Card>
      
      {/* Service Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRecord ? 'Edit Service Record' : 'Add Service Record'}
        size="medium"
      >
        {!selectedVehicle && !selectedRecord ? (
          <div className="vehicle-selection">
            <p>Please select a vehicle:</p>
            <select
              value={vehicleFilter}
              onChange={handleVehicleFilterChange}
              className="vehicle-select"
            >
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} - {vehicle.model}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <ServiceForm
            serviceRecord={selectedRecord}
            vehicle={selectedVehicle}
            onSubmit={handleServiceSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
      
      <style jsx>{`
        .service-dues-page {
          padding: var(--spacing-md);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .page-header h1 {
          margin: 0;
          font-size: var(--font-size-2xl);
          color: var(--primary-color);
        }
        
        .filter-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .filter-section label {
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .vehicle-filter {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          min-width: 250px;
          background-color: var(--background-color);
        }
        
        .vehicle-info-card {
          margin-bottom: var(--spacing-md);
        }
        
        .vehicle-info {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .info-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        
        .info-value {
          font-weight: 500;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }
        
        .vehicle-selection {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .vehicle-select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          width: 100%;
          background-color: var(--background-color);
        }
        
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          
          .filter-section {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }
          
          .vehicle-filter {
            width: 100%;
          }
          
          .vehicle-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceDuesPage;