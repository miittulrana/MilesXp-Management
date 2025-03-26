import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX } from '../../../lib/constants';
import VehicleMarker from './VehicleMarker';

// Set mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Center coordinates for Malta (approximately)
const MALTA_CENTER = {
  lng: 14.4,
  lat: 35.9,
  zoom: 10
};

/**
 * Map component using Mapbox GL
 * @param {Object} props - Component props
 * @returns {JSX.Element} Map component
 */
const Map = ({ 
  vehicles = [], 
  selectedVehicle = null,
  onVehicleSelect,
  onMapLoaded
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Initialize map
  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX.STYLE,
      center: [MALTA_CENTER.lng, MALTA_CENTER.lat],
      zoom: MALTA_CENTER.zoom,
      minZoom: 8, // Limit zoom out level
      maxZoom: 18 // Limit zoom in level
    });
    
    // Add navigation controls (zoom in/out)
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );
    
    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );
    
    // Map load handler
    map.current.on('load', () => {
      setMapLoaded(true);
      if (onMapLoaded) {
        onMapLoaded(map.current);
      }
    });
    
    // Cleanup on unmount
    return () => {
      // Remove all markers on unmount
      Object.values(markersRef.current).forEach(marker => marker.remove());
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onMapLoaded]);
  
  // Update vehicle markers when vehicles data changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !vehicles.length) return;
    
    // Track which vehicle IDs are in the current data set
    const currentVehicleIds = new Set();
    
    // Update or add markers for each vehicle
    vehicles.forEach(vehicle => {
      const vehicleId = vehicle.id;
      currentVehicleIds.add(vehicleId);
      
      if (vehicle.position) {
        const { latitude, longitude } = vehicle.position;
        
        if (markersRef.current[vehicleId]) {
          // Update existing marker position
          markersRef.current[vehicleId].update(
            vehicle,
            vehicleId === selectedVehicle?.id
          );
        } else {
          // Create new marker
          const markerEl = document.createElement('div');
          markerEl.className = 'vehicle-marker-container';
          
          // Instantiate the custom marker
          const vehicleMarker = new VehicleMarker(
            markerEl,
            vehicle,
            vehicleId === selectedVehicle?.id,
            () => {
              if (onVehicleSelect) {
                onVehicleSelect(vehicle);
              }
            }
          );
          
          // Create and add the Mapbox marker
          const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'bottom',
            offset: [0, -10]
          })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
          
          // Store marker reference
          markersRef.current[vehicleId] = {
            mapboxMarker: marker,
            customMarker: vehicleMarker,
            update: (newData, isSelected) => {
              // Update marker position with animation
              const { latitude: newLat, longitude: newLng, heading } = newData.position;
              marker.setLngLat([newLng, newLat]);
              
              // Update custom marker data and selection state
              vehicleMarker.update(newData, isSelected, heading);
            },
            remove: () => {
              marker.remove();
            }
          };
        }
      }
    });
    
    // Remove markers for vehicles no longer in the data
    Object.keys(markersRef.current).forEach(vehicleId => {
      if (!currentVehicleIds.has(vehicleId)) {
        markersRef.current[vehicleId].remove();
        delete markersRef.current[vehicleId];
      }
    });
  }, [vehicles, mapLoaded, selectedVehicle, onVehicleSelect]);
  
  // Update selected marker when selection changes
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Update selection state for all markers
    Object.keys(markersRef.current).forEach(vehicleId => {
      const isSelected = vehicleId === selectedVehicle?.id;
      markersRef.current[vehicleId].customMarker.setSelected(isSelected);
    });
    
    // If a vehicle is selected, fly to its position
    if (selectedVehicle && selectedVehicle.position) {
      const { latitude, longitude } = selectedVehicle.position;
      
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        speed: 1.2,
        curve: 1.4
      });
    }
  }, [selectedVehicle, mapLoaded]);
  
  return (
    <div 
      ref={mapContainer} 
      className="map-container" 
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    />
  );
};

Map.propTypes = {
  vehicles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      plate_number: PropTypes.string.isRequired,
      model: PropTypes.string,
      year: PropTypes.number,
      status: PropTypes.string,
      users: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string
      }),
      position: PropTypes.shape({
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
        timestamp: PropTypes.string.isRequired,
        speed: PropTypes.number,
        heading: PropTypes.number
      })
    })
  ),
  selectedVehicle: PropTypes.object,
  onVehicleSelect: PropTypes.func,
  onMapLoaded: PropTypes.func
};

export default Map;