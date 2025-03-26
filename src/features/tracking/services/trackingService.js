import supabase from '../../../lib/supabase';

/**
 * Service for vehicle tracking-related operations
 */
const trackingService = {
  /**
   * Get all tracked vehicles with their latest positions
   * @returns {Promise<Object>} Result object with data or error
   */
  async getTrackedVehicles() {
    try {
      // Get all vehicles that have tracking data
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate_number,
          model,
          year,
          status,
          users:assigned_to(id, name, email, phone)
        `)
        .in('status', ['available', 'assigned'])
        .order('plate_number', { ascending: true });
      
      if (error) throw error;
      
      // For each vehicle, get the latest position
      const vehiclesWithPosition = await Promise.all(
        data.map(async (vehicle) => {
          const { data: positionData, error: positionError } = await supabase
            .from('vehicle_tracking_logs')
            .select('latitude, longitude, timestamp, speed, heading')
            .eq('vehicle_id', vehicle.id)
            .order('timestamp', { ascending: false })
            .limit(1);
          
          if (positionError) throw positionError;
          
          return {
            ...vehicle,
            position: positionData && positionData.length > 0 ? positionData[0] : null
          };
        })
      );
      
      // Filter out vehicles without position data
      const trackedVehicles = vehiclesWithPosition.filter(vehicle => vehicle.position);
      
      return { data: trackedVehicles };
    } catch (error) {
      console.error('Error fetching tracked vehicles:', error);
      return { error };
    }
  },
  
  /**
   * Subscribe to real-time vehicle position updates
   * @param {Function} onUpdate - Callback function for updates
   * @returns {Object} Subscription object
   */
  subscribeToVehicleUpdates(onUpdate) {
    const subscription = supabase
      .channel('vehicle-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_tracking_logs'
        },
        (payload) => {
          // Process the new tracking log
          const update = {
            vehicleId: payload.new.vehicle_id,
            position: {
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              timestamp: payload.new.timestamp,
              speed: payload.new.speed,
              heading: payload.new.heading
            }
          };
          
          // Call the update callback
          onUpdate(update);
        }
      )
      .subscribe();
    
    return subscription;
  },
  
  /**
   * Get vehicle tracking history
   * @param {Object} params - Query parameters
   * @param {string} params.vehicleId - Vehicle ID
   * @param {Date} params.startTime - Start time
   * @param {Date} params.endTime - End time
   * @param {number} params.limit - Maximum number of points
   * @returns {Promise<Object>} Result object with data or error
   */
  async getVehicleTrackingHistory(params) {
    try {
      const { vehicleId, startTime, endTime, limit = 1000 } = params;
      
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      let query = supabase
        .from('vehicle_tracking_logs')
        .select('id, latitude, longitude, timestamp, speed, heading')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: true });
      
      if (startTime) {
        query = query.gte('timestamp', startTime.toISOString());
      }
      
      if (endTime) {
        query = query.lte('timestamp', endTime.toISOString());
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching vehicle tracking history:', error);
      return { error };
    }
  },
  
  /**
   * Unsubscribe from real-time updates
   * @param {Object} subscription - Subscription object
   */
  unsubscribeFromVehicleUpdates(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
};

export default trackingService;