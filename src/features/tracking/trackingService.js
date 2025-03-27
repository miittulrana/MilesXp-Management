import supabase from '../../lib/supabase';
import mapboxgl from 'mapbox-gl';

// Malta coordinates for the default map center
const MALTA_CENTER = {
  lat: 35.9375,
  lng: 14.3754
};

// Mapbox configuration
const MAPBOX_CONFIG = {
  style: 'mapbox://styles/mapbox/streets-v11',
  zoom: 10,
  center: [MALTA_CENTER.lng, MALTA_CENTER.lat]
};

/**
 * Service for vehicle tracking operations
 */
const trackingService = {
  // Initialize Mapbox token
  initializeMapbox: (token) => {
    mapboxgl.accessToken = token;
    console.log('Mapbox initialized with token');
  },
  
  /**
   * Get all tracked vehicles with their latest location
   * @returns {Promise<Array>} List of vehicles with tracking data
   */
  getTrackedVehicles: async () => {
    try {
      console.log('Fetching tracked vehicles...');
      
      // First get all active vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate_number,
          model,
          year,
          status,
          driver:assigned_to(id, name, email, phone)
        `)
        .in('status', ['available', 'assigned', 'blocked'])
        .order('plate_number', { ascending: true });
      
      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        throw vehiclesError;
      }
      
      console.log('Vehicles fetched:', vehicles?.length || 0);
      
      // For each vehicle, get the latest tracking log
      const vehiclesWithTracking = await Promise.all(vehicles.map(async (vehicle) => {
        try {
          const { data: logs, error: logsError } = await supabase
            .from('vehicle_tracking_logs')
            .select('*')
            .eq('vehicle_id', vehicle.id)
            .order('timestamp', { ascending: false })
            .limit(1);
          
          if (logsError) {
            console.warn(`Error fetching tracking logs for vehicle ${vehicle.id}:`, logsError);
            return {
              ...vehicle,
              driver_name: vehicle.driver?.name || null,
              position: null
            };
          }
          
          return {
            ...vehicle,
            driver_name: vehicle.driver?.name || null,
            position: logs?.[0] || null
          };
        } catch (error) {
          console.warn(`Exception fetching tracking logs for vehicle ${vehicle.id}:`, error);
          return {
            ...vehicle,
            driver_name: vehicle.driver?.name || null,
            position: null
          };
        }
      }));
      
      return vehiclesWithTracking;
    } catch (error) {
      console.error('Exception in getTrackedVehicles:', error);
      throw error;
    }
  },
  
  /**
   * Get tracking history for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {string} startTime - Start time (ISO string)
   * @param {string} endTime - End time (ISO string)
   * @param {number} limit - Maximum number of points to return
   * @returns {Promise<Array>} List of tracking points
   */
  getVehicleTrackingHistory: async (vehicleId, startTime, endTime, limit = 1000) => {
    try {
      console.log(`Fetching tracking history for vehicle ${vehicleId}...`);
      
      let query = supabase
        .from('vehicle_tracking_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: true }) // Ascending for path drawing
        .limit(limit);
      
      // Add time filters if provided
      if (startTime) {
        query = query.gte('timestamp', startTime);
      }
      
      if (endTime) {
        query = query.lte('timestamp', endTime);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching tracking history for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      console.log(`Tracking history fetched for vehicle ${vehicleId}:`, data?.length || 0, 'points');
      return data;
    } catch (error) {
      console.error(`Exception in getVehicleTrackingHistory:`, error);
      throw error;
    }
  },
  
  /**
   * Submit a new tracking point
   * @param {Object} trackingData - Tracking data
   * @returns {Promise<Object>} Created tracking point
   */
  submitTrackingPoint: async (trackingData) => {
    try {
      console.log('Submitting tracking point:', trackingData);
      
      // Get the current user (driver) if not provided
      let driverId = trackingData.driver_id;
      
      if (!driverId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get the user's database ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user ID:', userError);
          throw userError;
        }
        
        driverId = userData.id;
      }
      
      // Create the tracking point
      const { data, error } = await supabase
        .from('vehicle_tracking_logs')
        .insert({
          vehicle_id: trackingData.vehicle_id,
          driver_id: driverId,
          latitude: trackingData.latitude,
          longitude: trackingData.longitude,
          speed: trackingData.speed || 0,
          heading: trackingData.heading || 0,
          timestamp: trackingData.timestamp || new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error creating tracking point:', error);
        throw error;
      }
      
      console.log('Tracking point created successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Exception in submitTrackingPoint:', error);
      throw error;
    }
  },
  
  /**
   * Setup real-time tracking for a vehicle - returns subscription to cleanup later
   * @param {string} vehicleId - Vehicle ID to track
   * @param {Function} onLocationUpdate - Callback for location updates
   * @returns {Object} Subscription object 
   */
  subscribeToVehicleUpdates: (vehicleId, onLocationUpdate) => {
    console.log(`Setting up real-time tracking for vehicle ${vehicleId}...`);
    
    try {
      // Subscribe to the vehicle_tracking_logs table for this specific vehicle
      const channel = supabase
        .channel(`vehicle-updates:${vehicleId}`)
        .on('postgres_changes', {
          event: 'INSERT', 
          schema: 'public',
          table: 'vehicle_tracking_logs',
          filter: `vehicle_id=eq.${vehicleId}`
        }, (payload) => {
          console.log(`Received real-time update for vehicle ${vehicleId}:`, payload);
          if (onLocationUpdate && typeof onLocationUpdate === 'function') {
            onLocationUpdate(payload.new);
          }
        })
        .subscribe((status) => {
          console.log(`Realtime subscription status for vehicle ${vehicleId}:`, status);
        });
      
      return { 
        channel,
        unsubscribe: () => {
          console.log(`Unsubscribing from real-time updates for vehicle ${vehicleId}`);
          supabase.removeChannel(channel);
        }
      };
    } catch (error) {
      console.error(`Exception in subscribeToVehicleUpdates for vehicle ${vehicleId}:`, error);
      return {
        unsubscribe: () => console.log('No subscription to unsubscribe from')
      };
    }
  },
  
  /**
   * Initialize a Mapbox map in the specified container
   * @param {string} container - Container element ID
   * @param {Object} options - Map options
   * @returns {Object} Mapbox map instance
   */
  initMap: (container, options = {}) => {
    console.log('Initializing Mapbox map...');
    
    try {
      if (!mapboxgl.accessToken) {
        throw new Error('Mapbox token not initialized. Call initializeMapbox first.');
      }
      
      const mapOptions = {
        container,
        style: options.style || MAPBOX_CONFIG.style,
        center: options.center || MAPBOX_CONFIG.center,
        zoom: options.zoom || MAPBOX_CONFIG.zoom,
        attributionControl: false,
        // Malta settings
        maxBounds: [
          [14.1, 35.7], // Southwest coordinates
          [14.6, 36.1]  // Northeast coordinates
        ]
      };
      
      const map = new mapboxgl.Map(mapOptions);
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add attribution control
      map.addControl(new mapboxgl.AttributionControl({
        compact: true
      }));
      
      // Add geolocate control for user location
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }));
      
      console.log('Mapbox map initialized successfully');
      return map;
    } catch (error) {
      console.error('Error initializing Mapbox map:', error);
      throw error;
    }
  },
  
  /**
   * Add a vehicle marker to the map with real-time updates
   * @param {Object} map - Mapbox map instance
   * @param {Object} vehicle - Vehicle data with position
   * @param {boolean} animate - Whether to animate marker movements
   * @returns {Object} Marker and cleanup function
   */
  addVehicleMarker: (map, vehicle, animate = true) => {
    try {
      if (!map || !vehicle) {
        throw new Error('Map and vehicle are required');
      }
      
      console.log(`Adding marker for vehicle ${vehicle.id}:`, vehicle.plate_number);
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.classList.add(`status-${vehicle.status}`);
      
      // Add vehicle info to marker
      el.setAttribute('data-vehicle-id', vehicle.id);
      el.setAttribute('data-plate', vehicle.plate_number);
      
      // Set position if available
      const position = vehicle.position ? 
        [vehicle.position.longitude, vehicle.position.latitude] : 
        MAPBOX_CONFIG.center;
      
      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(position)
        .addTo(map);
      
      // Setup popup with vehicle info
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="vehicle-popup">
            <h3>${vehicle.plate_number}</h3>
            <p><strong>Model:</strong> ${vehicle.model} ${vehicle.year}</p>
            <p><strong>Status:</strong> ${vehicle.status}</p>
            <p><strong>Driver:</strong> ${vehicle.driver_name || 'Unassigned'}</p>
            ${vehicle.position ? `<p><strong>Speed:</strong> ${Math.round(vehicle.position.speed || 0)} km/h</p>` : ''}
            ${vehicle.position ? `<p><strong>Last Update:</strong> ${new Date(vehicle.position.timestamp).toLocaleTimeString()}</p>` : ''}
          </div>
        `);
      
      marker.setPopup(popup);
      
      // Set up real-time subscription for this vehicle
      const subscription = trackingService.subscribeToVehicleUpdates(
        vehicle.id,
        (newLocation) => {
          console.log(`Updating marker position for vehicle ${vehicle.id}`, newLocation);
          
          if (animate) {
            // Animate marker movement
            const start = marker.getLngLat();
            const end = {
              lng: newLocation.longitude,
              lat: newLocation.latitude
            };
            
            const startTime = performance.now();
            const duration = 5000; // 5 seconds animation
            
            function animateMarker(timestamp) {
              const elapsed = timestamp - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Interpolate position
              const lng = start.lng + (end.lng - start.lng) * progress;
              const lat = start.lat + (end.lat - start.lat) * progress;
              
              marker.setLngLat([lng, lat]);
              
              // Continue animation if not complete
              if (progress < 1) {
                requestAnimationFrame(animateMarker);
              }
            }
            
            requestAnimationFrame(animateMarker);
          } else {
            // Instant update
            marker.setLngLat([newLocation.longitude, newLocation.latitude]);
          }
          
          // Update popup content with new info
          popup.setHTML(`
            <div class="vehicle-popup">
              <h3>${vehicle.plate_number}</h3>
              <p><strong>Model:</strong> ${vehicle.model} ${vehicle.year}</p>
              <p><strong>Status:</strong> ${vehicle.status}</p>
              <p><strong>Driver:</strong> ${vehicle.driver_name || 'Unassigned'}</p>
              <p><strong>Speed:</strong> ${Math.round(newLocation.speed || 0)} km/h</p>
              <p><strong>Last Update:</strong> ${new Date(newLocation.timestamp).toLocaleTimeString()}</p>
            </div>
          `);
        }
      );
      
      // Return marker and cleanup function
      return {
        marker,
        cleanup: () => {
          subscription.unsubscribe();
          marker.remove();
        }
      };
    } catch (error) {
      console.error(`Exception in addVehicleMarker for vehicle ${vehicle?.id}:`, error);
      return {
        cleanup: () => console.log('No marker to clean up')
      };
    }
  },
  
  /**
   * Draw vehicle path on map
   * @param {Object} map - Mapbox map instance
   * @param {Array} trackingPoints - Array of tracking points
   * @param {string} sourceId - Source ID for the path
   * @returns {Object} Path and cleanup function
   */
  drawVehiclePath: (map, trackingPoints, sourceId = 'vehicle-path') => {
    try {
      if (!map || !trackingPoints || !trackingPoints.length) {
        throw new Error('Map and tracking points are required');
      }
      
      console.log(`Drawing path with ${trackingPoints.length} points`);
      
      // Convert tracking points to GeoJSON
      const coordinates = trackingPoints.map(point => [
        point.longitude,
        point.latitude
      ]);
      
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      };
      
      // Remove existing source and layer if they exist
      if (map.getSource(sourceId)) {
        map.removeLayer(`${sourceId}-line`);
        map.removeSource(sourceId);
      }
      
      // Add source and layer
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson
      });
      
      map.addLayer({
        id: `${sourceId}-line`,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#007bff',
          'line-width': 4,
          'line-opacity': 0.7
        }
      });
      
      // Fit bounds to the path
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
      
      // Return cleanup function
      return {
        update: (newPoints) => {
          const newCoordinates = newPoints.map(point => [
            point.longitude,
            point.latitude
          ]);
          
          const updatedGeojson = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: newCoordinates
            }
          };
          
          map.getSource(sourceId).setData(updatedGeojson);
        },
        cleanup: () => {
          if (map.getLayer(`${sourceId}-line`)) {
            map.removeLayer(`${sourceId}-line`);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        }
      };
    } catch (error) {
      console.error('Exception in drawVehiclePath:', error);
      return {
        cleanup: () => console.log('No path to clean up')
      };
    }
  },
  
  /**
   * Start sending location updates at regular intervals (for driver app)
   * @param {string} vehicleId - Vehicle ID 
   * @param {Function} getPosition - Function to get current position
   * @param {number} interval - Update interval in milliseconds (default: 5000)
   * @returns {Object} Tracker info and stop function
   */
  startLocationTracking: (vehicleId, getPosition, interval = 5000) => {
    console.log(`Starting location tracking for vehicle ${vehicleId} every ${interval}ms`);
    
    if (!vehicleId || typeof getPosition !== 'function') {
      throw new Error('Vehicle ID and position function are required');
    }
    
    // Start interval for position updates
    const timerId = setInterval(async () => {
      try {
        // Get current position
        const position = await getPosition();
        
        if (!position) {
          console.warn('Failed to get position, skipping update');
          return;
        }
        
        // Submit position update
        await trackingService.submitTrackingPoint({
          vehicle_id: vehicleId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s to km/h
          heading: position.coords.heading || 0,
          timestamp: new Date().toISOString()
        });
        
        console.log('Position update sent');
      } catch (error) {
        console.error('Error in location tracking interval:', error);
      }
    }, interval);
    
    // Return stop function
    return {
      timerId,
      stop: () => {
        console.log(`Stopping location tracking for vehicle ${vehicleId}`);
        clearInterval(timerId);
      }
    };
  }
};

export default trackingService;