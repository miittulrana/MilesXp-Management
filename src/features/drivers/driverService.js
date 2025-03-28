import supabase from '../../lib/supabase';
import { ROLES } from '../../lib/constants';

/**
 * Service for driver operations (users with driver role)
 */
const driverService = {
  /**
   * Get all drivers
   * @returns {Promise<Array>} List of drivers
   */
  getDrivers: async () => {
    try {
      console.log('Fetching drivers...');
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(id, plate_number, model, year)
        `)
        .eq('role', ROLES.DRIVER)
        .order('name');
      
      if (error) {
        console.error('Error fetching drivers:', error);
        throw new Error(error.message || 'Failed to fetch drivers');
      }
      
      console.log('Drivers fetched:', data?.length || 0);
      
      // Format data for UI
      return data.map(driver => ({
        ...driver,
        assigned_vehicle: driver.vehicles && driver.vehicles.length > 0 
          ? driver.vehicles[0].plate_number 
          : null,
        assigned_vehicle_id: driver.vehicles && driver.vehicles.length > 0 
          ? driver.vehicles[0].id 
          : null
      }));
    } catch (error) {
      console.error('Exception in getDrivers:', error);
      throw error;
    }
  },

  /**
   * Get driver by ID
   * @param {string} id - Driver ID
   * @returns {Promise<Object>} Driver details
   */
  getDriverById: async (id) => {
    try {
      console.log('Fetching driver details for ID:', id);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(id, plate_number, model, year)
        `)
        .eq('id', id)
        .eq('role', ROLES.DRIVER)
        .single();
      
      if (error) {
        console.error('Error fetching driver details:', error);
        throw new Error(error.message || 'Driver not found');
      }
      
      console.log('Driver details fetched:', data?.id);
      
      // Format data for UI
      return {
        ...data,
        assigned_vehicle: data.vehicles && data.vehicles.length > 0 
          ? data.vehicles[0].plate_number 
          : null,
        assigned_vehicle_id: data.vehicles && data.vehicles.length > 0 
          ? data.vehicles[0].id 
          : null
      };
    } catch (error) {
      console.error(`Exception in getDriverById:`, error);
      throw error;
    }
  },

  /**
   * Get driver assignments
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array>} List of driver's assignments
   */
  getDriverAssignments: async (driverId) => {
    try {
      console.log(`Fetching assignments for driver ${driverId}`);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model, year, status)
        `)
        .eq('driver_id', driverId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching assignments for driver ${driverId}:`, error);
        throw new Error(error.message || 'Failed to fetch driver assignments');
      }
      
      console.log(`Assignments fetched for driver ${driverId}:`, data?.length || 0);
      return data;
    } catch (error) {
      console.error(`Exception in getDriverAssignments:`, error);
      throw error;
    }
  },

  /**
   * Get driver documents
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array>} List of driver's documents
   */
  getDriverDocuments: async (driverId) => {
    try {
      console.log(`Fetching documents for driver ${driverId}`);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'driver')
        .eq('entity_id', driverId)
        .order('expiry_date');
      
      if (error) {
        console.error(`Error fetching documents for driver ${driverId}:`, error);
        throw new Error(error.message || 'Failed to fetch driver documents');
      }
      
      console.log(`Documents fetched for driver ${driverId}:`, data?.length || 0);
      
      // Process documents to add status
      return data.map(doc => {
        // Calculate status based on expiry date
        const today = new Date();
        const expiry = new Date(doc.expiry_date);
        const daysRemaining = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
        
        let status = 'valid';
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= 30) {
          status = 'expiring_soon';
        }
        
        return {
          ...doc,
          status,
          days_remaining: daysRemaining
        };
      });
    } catch (error) {
      console.error(`Exception in getDriverDocuments:`, error);
      throw error;
    }
  },

  /**
   * Get available drivers (not assigned to any vehicle)
   * @returns {Promise<Array>} List of available drivers
   */
  getAvailableDrivers: async () => {
    try {
      console.log('Fetching available drivers');
      
      // Get all drivers
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone
        `)
        .eq('role', ROLES.DRIVER)
        .order('name');
      
      if (error) {
        console.error('Error fetching available drivers:', error);
        throw new Error(error.message || 'Failed to fetch available drivers');
      }
      
      // Now get all assigned drivers
      const { data: assignedDrivers, error: assignedError } = await supabase
        .from('vehicles')
        .select('assigned_to')
        .not('assigned_to', 'is', null);
      
      if (!assignedError) {
        // Filter out assigned drivers
        const assignedIds = assignedDrivers.map(v => v.assigned_to);
        const availableDrivers = data.filter(driver => !assignedIds.includes(driver.id));
        
        console.log('Available drivers fetched:', availableDrivers?.length || 0);
        return availableDrivers;
      }
      
      // If there was an error getting assigned drivers, just return all drivers
      console.log('All drivers fetched (could not filter):', data?.length || 0);
      return data;
    } catch (error) {
      console.error('Exception in getAvailableDrivers:', error);
      throw error;
    }
  }
};

export default driverService;