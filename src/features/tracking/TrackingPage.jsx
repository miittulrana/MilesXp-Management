// src/features/tracking/TrackingPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import trackingService from './trackingService';
import { useToast } from '../../hooks/useToast';

const TrackingPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const { showError } = useToast();
  
  useEffect(() => {
    loadVehicles();
  }, []);
  
  // Filter vehicles when filter value changes
  useEffect(() => {
    if (!filterValue) {
      setFilteredVehicles(vehicles);
      return;
    }
    
    const filtered = vehicles.filter(vehicle => {
      const searchValue = filterValue.toLowerCase();
      return (
        vehicle.plate_number.toLowerCase().includes(searchValue) ||
        vehicle.model.toLowerCase().includes(searchValue) ||
        vehicle.users?.name?.toLowerCase().includes(searchValue)
      );
    });
    
    setFilteredVehicles(filtered);
  }, [vehicles, filterValue]);
  
  const loadVehicles = async () => {
    setLoading(true);
    
    try {
      const result = await trackingService.getTrackedVehicles();
      
      if (result.error) {
        showError('Error loading vehicles');
        console.error('Error loading vehicles:', result.error);
      } else {
        setVehicles(result.data || []);
        setFilteredVehicles(result.data || []);
      }
    } catch (error) {
      showError('Error loading vehicles');
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailsModalOpen(true);
  };
  
  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };
  
  return (
    <div className="tracking-page">
      <h1 className="page-title">Vehicle Tracking</h1>
      
      <div className="tracking-layout">
        <div className="map-container">
          <Card>
            <CardBody>
              {loading ? (
                <div className="map-placeholder loading">
                  <p>Loading map...</p>
                </div>
              ) : (
                <div className="map-placeholder">
                  <p className="map-info">Map would be displayed here</p>
                  <p className="map-subinfo">This is a simplified version without the actual map implementation</p>
                  <div className="map-legend">
                    <div className="legend-item">
                      <span className="vehicle-marker available"></span>
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <span className="vehicle-marker assigned"></span>
                      <span>Assigned</span>
                    </div>
                    <div className="legend-item">
                      <span className="vehicle-marker selected"></span>
                      <span>Selected</span>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        <div className="vehicles-sidebar">
          <Card>
            <CardHeader>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={filterValue}
                  onChange={handleFilterChange}
                  className="search-input"
                />
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="loading-container">
                  <p>Loading vehicles...</p>
                </div>
              ) : (
                <div className="vehicle-list">
                  {filteredVehicles.length === 0 ? (
                    <div className="no-vehicles">
                      <p>No vehicles found</p>
                    </div>
                  ) : (
                    filteredVehicles.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className={`vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                        onClick={() => handleVehicleSelect(vehicle)}
                      >
                        <div className="vehicle-primary">
                          <span className="plate-number">{vehicle.plate_number}</span>
                          <span className={`status ${vehicle.status}`}>{vehicle.status}</span>
                        </div>
                        <div className="vehicle-model">{vehicle.model} {vehicle.year}</div>
                        <div className="vehicle-driver">
                          Driver: {vehicle.users?.name || 'Unassigned'}
                        </div>
                        {vehicle.position?.speed !== undefined && (
                          <div className="vehicle-speed">
                            {Math.round(vehicle.position.speed)} km/h
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Vehicle details modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Vehicle Details: ${selectedVehicle.plate_number}`}
        >
          <div className="vehicle-details">
            <div className="detail-section">
              <h3>Vehicle Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Plate Number:</span>
                  <span className="detail-value">{selectedVehicle.plate_number}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Model:</span>
                  <span className="detail-value">{selectedVehicle.model} {selectedVehicle.year}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{selectedVehicle.status}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Driver Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedVehicle.users?.name || 'Unassigned'}</span>
                </div>
                {selectedVehicle.users?.email && (
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedVehicle.users.email}</span>
                  </div>
                )}
                {selectedVehicle.users?.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedVehicle.users.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            {selectedVehicle.position && (
              <div className="detail-section">
                <h3>Current Position</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">
                      {new Date(selectedVehicle.position.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Coordinates:</span>
                    <span className="detail-value">
                      {selectedVehicle.position.latitude.toFixed(6)}, {selectedVehicle.position.longitude.toFixed(6)}
                    </span>
                  </div>
                  {selectedVehicle.position.speed !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Speed:</span>
                      <span className="detail-value">{Math.round(selectedVehicle.position.speed)} km/h</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
      
      <style jsx>{`
        .tracking-page {
          padding: 20px;
        }
        
        .page-title {
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: bold;
        }
        
        .tracking-layout {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 20px;
        }
        
        .map-placeholder {
          height: 500px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
          border-radius: 8px;
          text-align: center;
        }
        
        .map-placeholder.loading {
          background-color: #f9f9f9;
        }
        
        .map-info {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 10px;
        }
        
        .map-subinfo {
          color: #666;
          margin-bottom: 20px;
        }
        
        .map-legend {
          display: flex;
          gap: 15px;
          margin-top: 10px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .vehicle-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }
        
        .vehicle-marker.available {
          background-color: #22c55e;
        }
        
        .vehicle-marker.assigned {
          background-color: #3b82f6;
        }
        
        .vehicle-marker.selected {
          background-color: #f59e0b;
        }
        
        .search-container {
          width: 100%;
        }
        
        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .vehicle-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .no-vehicles {
          padding: 20px;
          text-align: center;
          color: #666;
        }
        
        .vehicle-item {
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #eee;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .vehicle-item:hover {
          background-color: #f9f9f9;
        }
        
        .vehicle-item.selected {
          border-color: #f59e0b;
          background-color: #fff7ed;
        }
        
        .vehicle-primary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .plate-number {
          font-weight: 600;
          font-size: 16px;
        }
        
        .status {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .status.available {
          background-color: #dcfce7;
          color: #15803d;
        }
        
        .status.assigned {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        
        .status.blocked {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .vehicle-model {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .vehicle-driver {
          font-size: 13px;
          color: #666;
        }
        
        .vehicle-speed {
          margin-top: 6px;
          font-weight: 500;
          color: #f59e0b;
        }
        
        .vehicle-details {
          padding: 10px;
        }
        
        .detail-section {
          margin-bottom: 20px;
        }
        
        .detail-section h3 {
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 13px;
          color: #666;
        }
        
        .detail-value {
          font-weight: 500;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        @media (max-width: 768px) {
          .tracking-layout {
            grid-template-columns: 1fr;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackingPage;