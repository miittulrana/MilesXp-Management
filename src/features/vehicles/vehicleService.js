import supabase from '../../lib/supabase';

/**
 * Service for vehicle operations - Simplified version
 */
const vehicleService = {
  /**
   * Get all vehicles
   * @returns {Promise<Array>} List of vehicles
   */
  getVehicles: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          users:assigned_to (id, name, email, phone)
        `)
        .order('plate_number');
      
      if (error) {
        throw error;
      }
      
      // Format data for UI
      return data.map(vehicle => ({
        ...vehicle,
        driver_name: vehicle.users?.name || null
      }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle details
   */
  getVehicleById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          users:assigned_to (id, name, email, phone)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format data for UI
      return {
        ...data,
        driver_name: data.users?.name || null,
        driver_email: data.users?.email || null,
        driver_phone: data.users?.phone || null
      };
    } catch (error) {
      console.error(`Error fetching vehicle with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  addVehicle: async (vehicleData) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: vehicleData.plate_number,
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          status: 'available'
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  },

  /**
   * Update a vehicle
   * @param {string} id - Vehicle ID
   * @param {Object} vehicleData - Vehicle data to update
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          plate_number: vehicleData.plate_number,
          model: vehicleData.model,
          year: parseInt(vehicleData.year)
        })
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error(`Error updating vehicle:`, error);
      throw error;
    }
  },

  /**
   * Delete a vehicle
   * @param {string} id - Vehicle ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteVehicle: async (id) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting vehicle:`, error);
      throw error;
    }
  }
};

export default vehicleService;