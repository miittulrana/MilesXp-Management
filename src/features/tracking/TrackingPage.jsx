import React, { useEffect, useState, useRef } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import trackingService from './trackingService';
import { useToast } from '../../hooks/useToast';
import './TrackingPage.css';

// Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFuYWppNSIsImEiOiJjbThya2Y3ZmYwYWx6Mmxxb2JyazVyaXI4In0.gKa-iiWywmNLkg1HQ4Ln-Q'; // Replace with your actual Mapbox token

/**
 * Vehicle Tracking Page Component
 */
const TrackingPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isPathVisible, setIsPathVisible] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const path = useRef(null);
  
  const { showSuccess, showError } = useToast();
  
  // Initialize Mapbox when component mounts
  useEffect(() => {
    // Initialize Mapbox
    trackingService.initializeMapbox(MAPBOX_TOKEN);
    
    // Load vehicles
    loadVehicles();
    
    // Initialize map
    initializeMap();
    
    // Cleanup function
    return () => {
      // Clean up markers
      Object.values(markers.current).forEach(marker => {
        if (marker.cleanup) marker.cleanup();
      });
      
      // Clean up path
      if (path.current && path.current.cleanup) {
        path.current.cleanup();
      }
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
        (vehicle.driver_name && vehicle.driver_name.toLowerCase().includes(searchValue))
      );
    });
    
    setFilteredVehicles(filtered);
  }, [vehicles, filterValue]);
  
  // Initialize Mapbox map
  const initializeMap = () => {
    try {
      if (!mapContainer.current) return;
      
      map.current = trackingService.initMap(mapContainer.current, {
        zoom: 10
      });
      
      map.current.on('load', () => {
        setMapLoaded(true);
        showSuccess('Map loaded successfully');
      });
      
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        showError('Error loading map');
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      showError('Failed to initialize map');
    }
  };
  
  // Load vehicles from API
  const loadVehicles = async () => {
    setLoading(true);
    
    try {
      const result = await trackingService.getTrackedVehicles();
      
      setVehicles(result || []);
      setFilteredVehicles(result || []);
      
      // Add markers for vehicles with position
      if (map.current && mapLoaded) {
        addVehicleMarkers(result);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showError('Error loading vehicles');
    } finally {
      setLoading(false);
    }
  };
  
  // Add markers for all vehicles
  const addVehicleMarkers = (vehiclesToMark) => {
    // Clean up existing markers
    Object.values(markers.current).forEach(marker => {
      if (marker.cleanup) marker.cleanup();
    });
    
    markers.current = {};
    
    // Add new markers
    vehiclesToMark.forEach(vehicle => {
      if (!vehicle.position) return; // Skip vehicles without position
      
      const markerObject = trackingService.addVehicleMarker(map.current, vehicle, true);
      markers.current[vehicle.id] = markerObject;
    });
  };
  
  // Handle vehicle selection
  const handleVehicleSelect = async (vehicle) => {
    setSelectedVehicle(vehicle);
    
    // Center map on selected vehicle if it has position
    if (map.current && vehicle.position) {
      map.current.flyTo({
        center: [vehicle.position.longitude, vehicle.position.latitude],
        zoom: 15,
        essential: true
      });
      
      // Create or update marker for this vehicle
      if (markers.current[vehicle.id]) {
        // Marker already exists, remove it first
        markers.current[vehicle.id].cleanup();
      }
      
      // Add new marker
      markers.current[vehicle.id] = trackingService.addVehicleMarker(map.current, vehicle, true);
      
      // If path is visible, load and draw path
      if (isPathVisible) {
        await loadVehiclePath(vehicle.id);
      }
    }
  };
  
  // Load and draw vehicle path
  const loadVehiclePath = async (vehicleId) => {
    try {
      setLoading(true);
      
      // Get vehicle history for the last 24 hours
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const history = await trackingService.getVehicleTrackingHistory(
        vehicleId,
        startTime,
        endTime
      );
      
      if (!history || history.length === 0) {
        showError('No tracking history available for this vehicle');
        return;
      }
      
      // Draw path
      if (path.current && path.current.cleanup) {
        path.current.cleanup();
      }
      
      path.current = trackingService.drawVehiclePath(map.current, history);
      
      showSuccess(`Showing path with ${history.length} points`);
    } catch (error) {
      console.error('Error loading vehicle path:', error);
      showError('Failed to load vehicle path');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle path visibility
  const togglePath = async () => {
    const newPathVisible = !isPathVisible;
    setIsPathVisible(newPathVisible);
    
    if (newPathVisible && selectedVehicle) {
      // Show path
      await loadVehiclePath(selectedVehicle.id);
    } else if (!newPathVisible && path.current) {
      // Hide path
      path.current.cleanup();
      path.current = null;
    }
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };
  
  // Refresh vehicle data
  const handleRefresh = () => {
    loadVehicles();
  };
  
  return (
    <div className="tracking-page">
      <div className="page-header">
        <h1>Vehicle Tracking</h1>
        <div className="header-actions">
          <Button 
            variant="outline" 
            onClick={togglePath}
            disabled={!selectedVehicle}
          >
            {isPathVisible ? 'Hide Path' : 'Show Path'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="tracking-layout">
        {/* Map Container */}
        <div className="map-container">
          <Card>
            <CardBody className="map-card-body">
              {/* Map will be rendered here */}
              <div 
                ref={mapContainer} 
                className="map-element"
                style={{ width: '100%', height: '600px' }}
              />
              
              {/* Loading overlay */}
              {loading && (
                <div className="map-loading-overlay">
                  <div className="map-loading-spinner"></div>
                  <div className="map-loading-text">Loading...</div>
                </div>
              )}
              
              {/* Map Legend */}
              <div className="map-legend">
                <div className="legend-title">Legend</div>
                <div className="legend-item">
                  <span className="marker-icon available"></span>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="marker-icon assigned"></span>
                  <span>Assigned</span>
                </div>
                <div className="legend-item">
                  <span className="marker-icon blocked"></span>
                  <span>Blocked</span>
                </div>
                {isPathVisible && (
                  <div className="legend-item">
                    <span className="path-line"></span>
                    <span>Vehicle Path</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Vehicles Sidebar */}
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
              {loading && vehicles.length === 0 ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
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
                          Driver: {vehicle.driver_name || 'Unassigned'}
                        </div>
                        {vehicle.position && (
                          <div className="vehicle-position">
                            <div className="vehicle-speed">
                              {Math.round(vehicle.position.speed || 0)} km/h
                            </div>
                            <div className="vehicle-timestamp">
                              Last update: {new Date(vehicle.position.timestamp).toLocaleTimeString()}
                            </div>
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
    </div>
  );
};

export default TrackingPage;