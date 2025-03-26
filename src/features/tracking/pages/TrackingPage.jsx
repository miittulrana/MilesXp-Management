import React, { useState, useEffect, useRef } from 'react';
import Card, { CardHeader, CardBody } from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Select from '../../../components/common/Form/Select';
import Loader from '../../../components/common/Loader/Loader';
import Modal from '../../../components/common/Modal/Modal';
import Map from '../components/Map';
import trackingService from '../services/trackingService';
import { useToast } from '../../../hooks/useToast';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { formatDate } from '../../../lib/utils';

/**
 * Vehicle Tracking Page component
 * @returns {JSX.Element} Vehicle tracking page component
 */
const TrackingPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const realtimeSubscription = useRef(null);
  const mapInstance = useRef(null);
  const { showError, showSuccess, showInfo } = useToast();
  const { isOnline } = useOnlineStatus();
  
  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
    
    // Set up realtime subscription
    subscribeToUpdates();
    
    // Cleanup on unmount
    return () => {
      unsubscribeFromUpdates();
    };
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
  
  // Load vehicles data
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
  
  // Subscribe to real-time updates
  const subscribeToUpdates = () => {
    if (!isOnline) return;
    
    const subscription = trackingService.subscribeToVehicleUpdates(
      handleVehicleUpdate
    );
    
    realtimeSubscription.current = subscription;
  };
  
  // Unsubscribe from real-time updates
  const unsubscribeFromUpdates = () => {
    if (realtimeSubscription.current) {
      trackingService.unsubscribeFromVehicleUpdates(realtimeSubscription.current);
      realtimeSubscription.current = null;
    }
  };
  
  // Handle vehicle update from real-time subscription
  const handleVehicleUpdate = (update) => {
    setVehicles(prevVehicles => {
      // Find the vehicle to update
      const updatedVehicles = prevVehicles.map(vehicle => {
        if (vehicle.id === update.vehicleId) {
          // Update position
          return {
            ...vehicle,
            position: update.position
          };
        }
        return vehicle;
      });
      
      return updatedVehicles;
    });
  };
  
  // Handle map loaded event
  const handleMapLoaded = (map) => {
    mapInstance.current = map;
  };
  
  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailsModalOpen(true);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };
  
  // Handle view history click
  const handleViewHistory = async () => {
    if (!selectedVehicle) return;
    
    setHistoryLoading(true);
    setIsHistoryModalOpen(true);
    
    try {
      // Get 24 hours history
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      
      const result = await trackingService.getVehicleTrackingHistory({
        vehicleId: selectedVehicle.id,
        startTime,
        endTime
      });
      
      if (result.error) {
        showError('Error loading vehicle history');
        console.error('Error loading vehicle history:', result.error);
      } else {
        setSelectedVehicleHistory(result.data || []);
        
        // If there's history data and a map instance, add the path to the map
        if (result.data?.length > 0 && mapInstance.current) {
          showHistoryPath(result.data);
        } else if (!result.data?.length) {
          showInfo('No tracking history found for the last 24 hours');
        }
      }
    } catch (error) {
      showError('Error loading vehicle history');
      console.error('Error loading vehicle history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Show history path on map
  const showHistoryPath = (historyData) => {
    if (!mapInstance.current || !historyData.length) return;
    
    const map = mapInstance.current;
    
    // Remove any existing history layers
    if (map.getSource('route')) {
      map.removeLayer('route-line');
      map.removeSource('route');
    }
    
    // Create GeoJSON object from history data
    const coordinates = historyData.map(point => [point.longitude, point.latitude]);
    
    // Add the route source and layer
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });
    
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ff7700',
        'line-width': 4,
        'line-opacity': 0.7
      }
    });
    
    // Fit the map to the route
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
    
    showSuccess('History path loaded successfully');
  };
  
  // Clear history path from map
  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
    setSelectedVehicleHistory(null);
    
    // Remove history path from map
    if (mapInstance.current) {
      const map = mapInstance.current;
      
      if (map.getSource('route')) {
        map.removeLayer('route-line');
        map.removeSource('route');
      }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vehicle Tracking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardBody>
              <div style={{ height: '600px' }}>
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader size="large" text="Loading vehicles..." />
                  </div>
                ) : (
                  <Map
                    vehicles={filteredVehicles}
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={handleVehicleSelect}
                    onMapLoaded={handleMapLoaded}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-2">Vehicles</h3>
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={filterValue}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader size="medium" text="Loading..." />
                </div>
              ) : (
                <div className="vehicle-list">
                  {filteredVehicles.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No vehicles found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredVehicles.map(vehicle => (
                        <div
                          key={vehicle.id}
                          className={`vehicle-item p-3 rounded cursor-pointer hover:bg-gray-100 ${
                            selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-l-4 border-primary' : ''
                          }`}
                          onClick={() => handleVehicleSelect(vehicle)}
                        >
                          <div className="font-semibold text-primary">
                            {vehicle.plate_number}
                          </div>
                          <div className="text-sm">
                            {vehicle.model} {vehicle.year}
                          </div>
                          <div className="text-sm text-gray-600">
                            Driver: {vehicle.users?.name || 'Unassigned'}
                          </div>
                          {vehicle.position?.speed && (
                            <div className="text-xs text-secondary mt-1">
                              {Math.round(vehicle.position.speed)} km/h
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
          size="small"
        >
          <div className="vehicle-details">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
              <p>
                <span className="font-medium">Plate Number:</span> {selectedVehicle.plate_number}
              </p>
              <p>
                <span className="font-medium">Model:</span> {selectedVehicle.model} {selectedVehicle.year}
              </p>
              <p>
                <span className="font-medium">Status:</span> {selectedVehicle.status}
              </p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Driver Information</h3>
              <p>
                <span className="font-medium">Name:</span> {selectedVehicle.users?.name || 'Unassigned'}
              </p>
              {selectedVehicle.users?.email && (
                <p>
                  <span className="font-medium">Email:</span> {selectedVehicle.users.email}
                </p>
              )}
              {selectedVehicle.users?.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {selectedVehicle.users.phone}
                </p>
              )}
            </div>
            
            {selectedVehicle.position && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Current Status</h3>
                <p>
                  <span className="font-medium">Last Updated:</span> {formatDate(selectedVehicle.position.timestamp, 'YYYY-MM-DD HH:mm:ss')}
                </p>
                <p>
                  <span className="font-medium">Coordinates:</span> {selectedVehicle.position.latitude.toFixed(6)}, {selectedVehicle.position.longitude.toFixed(6)}
                </p>
                {selectedVehicle.position.speed && (
                  <p>
                    <span className="font-medium">Speed:</span> {Math.round(selectedVehicle.position.speed)} km/h
                  </p>
                )}
                {selectedVehicle.position.heading && (
                  <p>
                    <span className="font-medium">Heading:</span> {Math.round(selectedVehicle.position.heading)}°
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Button onClick={handleViewHistory}>View 24h History</Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* History modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={handleCloseHistory}
          title={`Tracking History: ${selectedVehicle.plate_number}`}
          size="small"
        >
          <div className="history-details">
            {historyLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader size="medium" text="Loading history..." />
              </div>
            ) : selectedVehicleHistory && selectedVehicleHistory.length > 0 ? (
              <div>
                <p className="mb-4">
                  Showing {selectedVehicleHistory.length} tracking points from the last 24 hours.
                  The path is highlighted on the map.
                </p>
                <div className="history-stats mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-xs text-gray-600">Start Time</div>
                      <div className="font-medium">
                        {formatDate(selectedVehicleHistory[0]?.timestamp, 'YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-xs text-gray-600">End Time</div>
                      <div className="font-medium">
                        {formatDate(selectedVehicleHistory[selectedVehicleHistory.length - 1]?.timestamp, 'YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-xs text-gray-600">Max Speed</div>
                      <div className="font-medium">
                        {Math.max(...selectedVehicleHistory.map(point => point.speed || 0)).toFixed(0)} km/h
                      </div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-xs text-gray-600">Avg Speed</div>
                      <div className="font-medium">
                        {(selectedVehicleHistory.reduce((sum, point) => sum + (point.speed || 0), 0) / selectedVehicleHistory.length).toFixed(0)} km/h
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No tracking history available for the last 24 hours
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TrackingPage;