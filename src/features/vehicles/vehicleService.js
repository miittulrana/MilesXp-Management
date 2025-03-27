import supabase from '../../lib/supabase';

/**
 * Service for vehicle operations
 */
const vehicleService = {
  /**
   * Get all vehicles
   * @returns {Promise<Array>} List of vehicles
   */
  getVehicles: async () => {
    try {
      console.log('Fetching vehicles...');
      
      // Check authentication first
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }

      // First try a simpler query without the join to check if basic access works
      const { data: testData, error: testError } = await supabase
        .from('vehicles')
        .select('*')
        .limit(1);
        
      if (testError) {
        console.error('Basic vehicle query failed:', testError);
        console.error('Error code:', testError.code);
        console.error('Error details:', testError.details);
        console.error('Error hint:', testError.hint);
        throw new Error(`Database access error: ${testError.message}`);
      }
      
      // If basic query worked, proceed with full query
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email, phone)
        `)
        .order('plate_number');
      
      if (error) {
        console.error('Error fetching vehicles with join:', error);
        throw error;
      }
      
      console.log('Vehicles fetched:', data?.length || 0);
      
      // Format data for UI, safely handle null driver
      return data.map(vehicle => ({
        ...vehicle,
        driver_name: vehicle.driver?.name || null
      }));
    } catch (error) {
      console.error('Exception in getVehicles:', error);
      throw error;
    }
  },

  // The rest of your vehicleService code remains unchanged
  /**
   * Get vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle details
   */
  getVehicleById: async (id) => {
    try {
      console.log('Fetching vehicle details for ID:', id);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email, phone)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching vehicle details:', error);
        throw error;
      }
      
      console.log('Vehicle details fetched:', data?.id);
      
      // Format data for UI
      return {
        ...data,
        driver_name: data.driver?.name || null,
        driver_email: data.driver?.email || null,
        driver_phone: data.driver?.phone || null
      };
    } catch (error) {
      console.error(`Exception in getVehicleById:`, error);
      throw error;
    }
  },

  /**
   * Get vehicles by status
   * @param {string} status - Vehicle status
   * @returns {Promise<Array>} List of vehicles with specified status
   */
  getVehiclesByStatus: async (status) => {
    try {
      console.log(`Fetching vehicles with status: ${status}`);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email, phone)
        `)
        .eq('status', status)
        .order('plate_number');
      
      if (error) {
        console.error(`Error fetching vehicles with status ${status}:`, error);
        throw error;
      }
      
      console.log(`Vehicles with status ${status} fetched:`, data?.length || 0);
      
      // Format data for UI
      return data.map(vehicle => ({
        ...vehicle,
        driver_name: vehicle.driver?.name || null
      }));
    } catch (error) {
      console.error(`Exception in getVehiclesByStatus:`, error);
      throw error;
    }
  },

  /**
   * Get available vehicles (not assigned or blocked)
   * @returns {Promise<Array>} List of available vehicles
   */
  getAvailableVehicles: async () => {
    try {
      console.log('Fetching available vehicles');
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available')
        .order('plate_number');
      
      if (error) {
        console.error('Error fetching available vehicles:', error);
        throw error;
      }
      
      console.log('Available vehicles fetched:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('Exception in getAvailableVehicles:', error);
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
      console.log('Adding new vehicle:', vehicleData);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: vehicleData.plate_number,
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          status: 'available',
          metadata: vehicleData.metadata || {}
        })
        .select();
      
      if (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle added successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Exception in addVehicle:', error);
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
      console.log('Updating vehicle ID:', id, vehicleData);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      // Create update object with only provided fields
      const updateData = {};
      if (vehicleData.plate_number !== undefined) updateData.plate_number = vehicleData.plate_number;
      if (vehicleData.model !== undefined) updateData.model = vehicleData.model;
      if (vehicleData.year !== undefined) updateData.year = parseInt(vehicleData.year);
      if (vehicleData.status !== undefined) updateData.status = vehicleData.status;
      if (vehicleData.assigned_to !== undefined) updateData.assigned_to = vehicleData.assigned_to;
      if (vehicleData.metadata !== undefined) updateData.metadata = vehicleData.metadata;
      
      const { data, error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateVehicle:`, error);
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
      console.log('Deleting vehicle ID:', id);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle deleted successfully');
      return true;
    } catch (error) {
      console.error(`Exception in deleteVehicle:`, error);
      throw error;
    }
  },

  /**
   * Assign a vehicle to a driver
   * @param {string} vehicleId - Vehicle ID
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Updated vehicle
   */
  assignVehicle: async (vehicleId, driverId) => {
    try {
      console.log(`Assigning vehicle ${vehicleId} to driver ${driverId}`);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: driverId,
          status: 'assigned'
        })
        .eq('id', vehicleId)
        .select();
      
      if (error) {
        console.error('Error assigning vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle assigned successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in assignVehicle:`, error);
      throw error;
    }
  },

  /**
   * Unassign a vehicle from its driver
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Updated vehicle
   */
  unassignVehicle: async (vehicleId) => {
    try {
      console.log(`Unassigning vehicle ${vehicleId}`);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: null,
          status: 'available'
        })
        .eq('id', vehicleId)
        .select();
      
      if (error) {
        console.error('Error unassigning vehicle:', error);
        throw error;
      }
      
      console.log('Vehicle unassigned successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in unassignVehicle:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle metadata
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle metadata
   */
  getVehicleMetadata: async (vehicleId) => {
    try {
      console.log(`Fetching metadata for vehicle ${vehicleId}`);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('metadata')
        .eq('id', vehicleId)
        .single();
      
      if (error) {
        console.error(`Error fetching metadata for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      return data.metadata || {};
    } catch (error) {
      console.error(`Exception in getVehicleMetadata:`, error);
      throw error;
    }
  },

  /**
   * Update vehicle metadata
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} metadata - Metadata object
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicleMetadata: async (vehicleId, metadata) => {
    try {
      console.log(`Updating metadata for vehicle ${vehicleId}`);
      
      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required');
      }
      
      // First get current metadata
      const { data: currentData, error: fetchError } = await supabase
        .from('vehicles')
        .select('metadata')
        .eq('id', vehicleId)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching current metadata for vehicle ${vehicleId}:`, fetchError);
        throw fetchError;
      }
      
      // Merge with new metadata
      const updatedMetadata = {
        ...(currentData.metadata || {}),
        ...metadata
      };
      
      // Update the vehicle
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          metadata: updatedMetadata
        })
        .eq('id', vehicleId)
        .select();
      
      if (error) {
        console.error(`Error updating metadata for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      console.log('Vehicle metadata updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateVehicleMetadata:`, error);
      throw error;
    }
  }
};

export default vehicleService;