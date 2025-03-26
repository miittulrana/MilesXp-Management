import supabase from '../../../lib/supabase';

/**
 * Service for vehicle-related operations
 */
const VehicleService = {
  /**
   * Get all vehicles with assigned driver information
   * @returns {Promise<Array>} Array of vehicles
   */
  getVehicles: async () => {
    try {
      // First check if the optimized function exists
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_all_vehicles_summary');
      
      if (!summaryError && summaryData) {
        return summaryData;
      }
      
      // Fall back to regular query if the function is not available
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email)
        `)
        .order('plate_number');
      
      if (error) throw error;
      
      // Format data to include driver_name
      return data.map(vehicle => ({
        ...vehicle,
        driver_name: vehicle.driver ? vehicle.driver.name : null,
        driver_email: vehicle.driver ? vehicle.driver.email : null
      }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },
  
  /**
   * Get vehicle by ID with detailed information
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle details
   */
  getVehicleById: async (id) => {
    try {
      // First try the optimized function
      const { data: vehicleDetails, error: functionError } = await supabase
        .rpc('get_vehicle_details', { vehicle_id: id });
      
      if (!functionError && vehicleDetails && vehicleDetails.length > 0) {
        return vehicleDetails[0];
      }
      
      // Fall back to regular query
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email, phone)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Format data
      return {
        ...data,
        driver_name: data.driver ? data.driver.name : null,
        driver_email: data.driver ? data.driver.email : null,
        driver_phone: data.driver ? data.driver.phone : null
      };
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Added vehicle
   */
  addVehicle: async (vehicleData) => {
    try {
      // Check if admin function exists and use it
      const isAdmin = true; // This would be determined by your auth logic
      if (isAdmin) {
        const { data: adminData, error: adminError } = await supabase
          .rpc('add_vehicle', {
            plate: vehicleData.plate_number.toUpperCase(),
            model_name: vehicleData.model,
            year_val: parseInt(vehicleData.year),
            admin_id: null // This would be the current user's ID
          });
        
        if (!adminError && adminData) {
          return { id: adminData };
        }
      }
      
      // Fall back to regular insert
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: vehicleData.plate_number.toUpperCase(),
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          status: vehicleData.status,
          assigned_to: vehicleData.status === 'assigned' ? vehicleData.assigned_to : null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing vehicle
   * @param {string} id - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      // If status is 'assigned', assign the driver, otherwise clear assignment
      const assigned_to = vehicleData.status === 'assigned' ? vehicleData.assigned_to : null;
      
      // Check if we need to assign a vehicle
      if (vehicleData.status === 'assigned' && assigned_to) {
        // Try using the assign_vehicle_to_driver function
        const { data: assignData, error: assignError } = await supabase
          .rpc('assign_vehicle_to_driver', {
            v_id: id,
            d_id: assigned_to,
            admin_id: null // This would be the current user's ID
          });
        
        if (assignError) {
          console.error('Error using assign function, falling back to update:', assignError);
        } else if (assignData) {
          // Function succeeded, just update other fields
          const { data, error } = await supabase
            .from('vehicles')
            .update({
              plate_number: vehicleData.plate_number.toUpperCase(),
              model: vehicleData.model,
              year: parseInt(vehicleData.year)
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          
          return data;
        }
      }
      
      // Regular update
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          plate_number: vehicleData.plate_number.toUpperCase(),
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          status: vehicleData.status,
          assigned_to
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a vehicle
   * @param {string} id - Vehicle ID
   * @returns {Promise<void>}
   */
  deleteVehicle: async (id) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Search vehicles by text
   * @param {string} searchText - Search text
   * @returns {Promise<Array>} Array of matching vehicles
   */
  searchVehicles: async (searchText) => {
    try {
      // Try using the search_vehicles function
      const { data: searchData, error: searchError } = await supabase
        .rpc('search_vehicles', { search_text: searchText });
      
      if (!searchError && searchData) {
        return searchData;
      }
      
      // Fall back to regular search
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email)
        `)
        .or(`plate_number.ilike.%${searchText}%,model.ilike.%${searchText}%`)
        .order('plate_number');
      
      if (error) throw error;
      
      // Format data
      return data.map(vehicle => ({
        ...vehicle,
        driver_name: vehicle.driver ? vehicle.driver.name : null,
        driver_email: vehicle.driver ? vehicle.driver.email : null
      }));
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }
};

export default VehicleService;