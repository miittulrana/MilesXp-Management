// src/features/tracking/trackingService.js
import supabase from '../../lib/supabase';

const trackingService = {
  getTrackedVehicles: async () => {
    try {
      // Get all vehicles with tracking data
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
        .in('status', ['available', 'assigned', 'blocked'])
        .order('plate_number', { ascending: true });
      
      if (error) throw error;
      
      // Add mock position data for demonstration
      const vehiclesWithPosition = data.map(vehicle => {
        // Generate random position within Malta bounds
        const latitude = 35.8 + Math.random() * 0.3;
        const longitude = 14.3 + Math.random() * 0.4;
        
        return {
          ...vehicle,
          position: {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            speed: Math.floor(Math.random() * 60),
            heading: Math.floor(Math.random() * 360)
          }
        };
      });
      
      return { data: vehiclesWithPosition };
    } catch (error) {
      console.error('Error fetching tracked vehicles:', error);
      return { error };
    }
  },
  
  getVehicleTrackingHistory: async (params) => {
    try {
      const { vehicleId, startTime, endTime, limit = 1000 } = params;
      
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // This is a simplified version that returns mock data
      const mockData = [];
      
      // Generate some mock history points
      const totalPoints = 20;
      const startTimestamp = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago
      const endTimestamp = endTime || new Date();
      const timeStep = (endTimestamp - startTimestamp) / totalPoints;
      
      // Create a path that looks somewhat realistic
      let latitude = 35.8 + Math.random() * 0.2;
      let longitude = 14.3 + Math.random() * 0.3;
      
      for (let i = 0; i < totalPoints; i++) {
        const pointTime = new Date(startTimestamp.getTime() + i * timeStep);
        
        // Small random movement
        latitude += (Math.random() - 0.5) * 0.01;
        longitude += (Math.random() - 0.5) * 0.01;
        
        mockData.push({
          id: `mock-${i}`,
          vehicle_id: vehicleId,
          latitude,
          longitude,
          timestamp: pointTime.toISOString(),
          speed: 20 + Math.floor(Math.random() * 40),
          heading: Math.floor(Math.random() * 360)
        });
      }
      
      return { data: mockData };
    } catch (error) {
      console.error('Error fetching vehicle tracking history:', error);
      return { error };
    }
  },
  
  // This function would subscribe to real-time updates in a real implementation
  subscribeToVehicleUpdates: (onUpdate) => {
    console.log('Simulating real-time subscription');
    
    // In a real implementation, this would use Supabase's real-time subscription
    // For this simplified version, we'll just return a mock subscription object
    return {
      subscription: 'mock-subscription',
      unsubscribe: () => console.log('Unsubscribed from mock subscription')
    };
  },
  
  // This would unsubscribe from real-time updates in a real implementation
  unsubscribeFromVehicleUpdates: (subscription) => {
    if (subscription) {
      console.log('Unsubscribing from mock subscription');
      // In a real implementation, this would use Supabase's removeChannel
    }
  }
};

export default trackingService;