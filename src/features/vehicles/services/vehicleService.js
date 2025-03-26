import supabase from '../../../lib/supabase';

/**
 * Service for vehicle operations
 */
const VehicleService = {
  /**
   * Get all vehicles
   * @returns {Promise<Array>} List of vehicles
   */
  getVehicles: async () => {
    console.log('[VEHICLE] Fetching all vehicles');
    try {
      // First try to use the optimized function from the SQL
      try {
        const { data, error } = await supabase.rpc('get_all_vehicles_summary');
        
        if (!error && data) {
          console.log('[VEHICLE] Successfully fetched vehicles using RPC function');
          return data;
        } else {
          console.warn('[VEHICLE] RPC function failed, falling back to direct query:', error);
        }
      } catch (rpcError) {
        console.warn('[VEHICLE] RPC function threw exception, falling back to direct query:', rpcError);
      }
      
      // Fallback to direct query
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
      
      return data || [];
    } catch (error) {
      console.error('[VEHICLE] Error fetching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle details
   */
  getVehicleById: async (id) => {
    console.log(`[VEHICLE] Fetching vehicle with ID: ${id}`);
    try {
      // Try to use the optimized function first
      try {
        const { data, error } = await supabase.rpc('get_vehicle_details', { vehicle_id: id });
        
        if (!error && data) {
          // RPC function might return array or single object depending on implementation
          if (Array.isArray(data)) {
            return data[0];
          }
          return data;
        } else {
          console.warn('[VEHICLE] RPC function failed, falling back to direct query:', error);
        }
      } catch (rpcError) {
        console.warn('[VEHICLE] RPC function threw exception, falling back to direct query:', rpcError);
      }
      
      // Fallback to direct query
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
      
      return data;
    } catch (error) {
      console.error(`[VEHICLE] Error fetching vehicle with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search vehicles by search term
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of vehicles matching search
   */
  searchVehicles: async (searchTerm) => {
    console.log(`[VEHICLE] Searching vehicles with term: ${searchTerm}`);
    try {
      // Try to use the optimized search function
      try {
        const { data, error } = await supabase.rpc('search_vehicles', { search_text: searchTerm });
        
        if (!error && data) {
          return data;
        } else {
          console.warn('[VEHICLE] Search RPC function failed, falling back to direct query:', error);
        }
      } catch (rpcError) {
        console.warn('[VEHICLE] Search RPC function threw exception, falling back to direct query:', rpcError);
      }
      
      // Fallback to direct search
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          users:assigned_to (id, name, email, phone)
        `)
        .or(`plate_number.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`[VEHICLE] Error searching vehicles:`, error);
      throw error;
    }
  },

  /**
   * Add a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  addVehicle: async (vehicleData) => {
    console.log('[VEHICLE] Adding new vehicle:', vehicleData);
    try {
      // For direct insertion we need the current user's ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      // Try using the add_vehicle function from the SQL
      try {
        const { data, error } = await supabase.rpc('add_vehicle', {
          plate: vehicleData.plate_number,
          model_name: vehicleData.model,
          year_val: parseInt(vehicleData.year),
          admin_id: userData.user.id
        });
        
        if (!error) {
          // The function returns the ID of the new vehicle
          console.log('[VEHICLE] Vehicle added successfully with RPC function, ID:', data);
          
          // Now fetch the complete vehicle details
          return await VehicleService.getVehicleById(data);
        } else {
          console.warn('[VEHICLE] RPC function failed, falling back to direct insertion:', error);
        }
      } catch (rpcError) {
        console.warn('[VEHICLE] RPC function threw exception, falling back to direct insertion:', rpcError);
      }
      
      // Fallback to direct insert
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: vehicleData.plate_number,
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          status: 'available',
          created_by: userData.user.id
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error('[VEHICLE] Error adding vehicle:', error);
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
    console.log(`[VEHICLE] Updating vehicle with ID ${id}:`, vehicleData);
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
      console.error(`[VEHICLE] Error updating vehicle:`, error);
      throw error;
    }
  },

  /**
   * Delete a vehicle
   * @param {string} id - Vehicle ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteVehicle: async (id) => {
    console.log(`[VEHICLE] Deleting vehicle with ID: ${id}`);
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
      console.error(`[VEHICLE] Error deleting vehicle:`, error);
      throw error;
    }
  }
};

export default VehicleService;