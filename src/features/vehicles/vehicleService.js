import supabase from '../../lib/supabase';

/**
 * Service for vehicle operations
 */
const vehicleService = {
  /**
   * Get all vehicles with driver information
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

      // Get vehicles with driver information
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:assigned_to(id, name, email, phone)
        `)
        .order('plate_number');
      
      if (error) {
        console.error('Error fetching vehicles:', error);
        throw new Error(error.message || 'Failed to fetch vehicles');
      }
      
      console.log('Vehicles fetched:', data?.length || 0);
      
      // Format data for UI, safely handle null driver
      return data.map(vehicle => ({
        ...vehicle,
        driver_name: vehicle.driver?.name || null,
        driver_email: vehicle.driver?.email || null,
        driver_phone: vehicle.driver?.phone || null
      }));
    } catch (error) {
      console.error('Exception in getVehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicle by ID with driver details
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
        throw new Error(error.message || 'Vehicle not found');
      }
      
      console.log('Vehicle details fetched:', data?.id);
      
      // Format data for UI
      return {
        ...data,
        driver_name: data.driver?.name || null,
        driver_email: data.driver?.email || null,
        driver_phone: data.driver?.phone || null,
        driver_id: data.assigned_to || null  // Add driver_id for our form
      };
    } catch (error) {
      console.error(`Exception in getVehicleById:`, error);
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
      
      // Check if we should assign a driver
      const shouldAssignDriver = vehicleData.status === 'assigned' && vehicleData.driver_id;
      
      // Prepare vehicle data
      const newVehicle = {
        plate_number: vehicleData.plate_number,
        model: vehicleData.model,
        year: parseInt(vehicleData.year),
        status: vehicleData.status,
        assigned_to: shouldAssignDriver ? vehicleData.driver_id : null,
        metadata: vehicleData.metadata || {}
      };
      
      // Insert the vehicle
      const { data, error } = await supabase
        .from('vehicles')
        .insert(newVehicle)
        .select();
      
      if (error) {
        console.error('Error adding vehicle:', error);
        throw new Error(error.message || 'Failed to add vehicle');
      }
      
      // Create assignment record if needed
      if (shouldAssignDriver && data[0].id) {
        try {
          // Get current user's ID
          const { data: authData } = await supabase.auth.getSession();
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authData.session.user.id)
            .single();
          
          // Create the assignment record
          await supabase
            .from('vehicle_assignments')
            .insert({
              vehicle_id: data[0].id,
              driver_id: vehicleData.driver_id,
              assigned_by: userData?.id,
              start_date: new Date().toISOString(),
              end_date: null,
              reason: 'Initial assignment',
              status: 'active'
            });
        } catch (assignmentError) {
          console.error('Error creating assignment record:', assignmentError);
          // Continue anyway
        }
      }
      
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
      
      // Determine driver assignment status
      const shouldAssignDriver = vehicleData.status === 'assigned' && vehicleData.driver_id;
      
      // Get current vehicle data
      const { data: currentVehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('assigned_to, status')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching current vehicle data:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch current vehicle data');
      }
      
      // Create update object
      const updateData = {};
      if (vehicleData.plate_number !== undefined) updateData.plate_number = vehicleData.plate_number;
      if (vehicleData.model !== undefined) updateData.model = vehicleData.model;
      if (vehicleData.year !== undefined) updateData.year = parseInt(vehicleData.year);
      if (vehicleData.status !== undefined) updateData.status = vehicleData.status;
      if (vehicleData.metadata !== undefined) updateData.metadata = vehicleData.metadata;
      
      // Handle assigned_to field
      if (vehicleData.status !== undefined) {
        if (vehicleData.status === 'assigned' && vehicleData.driver_id) {
          updateData.assigned_to = vehicleData.driver_id;
        } else if (vehicleData.status !== 'assigned') {
          updateData.assigned_to = null;
        }
      }
      
      // Update the vehicle
      const { data, error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating vehicle:', error);
        throw new Error(error.message || 'Failed to update vehicle');
      }
      
      // Update assignment records if needed
      const assignmentChanged = currentVehicle.assigned_to !== (vehicleData.driver_id || null) || 
                               currentVehicle.status !== vehicleData.status;
      
      if (assignmentChanged) {
        try {
          // Get current user ID
          const { data: authData } = await supabase.auth.getSession();
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authData.session.user.id)
            .single();
          
          // Complete any active assignments
          await supabase
            .from('vehicle_assignments')
            .update({
              status: 'completed',
              end_date: new Date().toISOString()
            })
            .eq('vehicle_id', id)
            .eq('status', 'active');
          
          // Create new assignment if needed
          if (shouldAssignDriver) {
            await supabase
              .from('vehicle_assignments')
              .insert({
                vehicle_id: id,
                driver_id: vehicleData.driver_id,
                assigned_by: userData?.id,
                start_date: new Date().toISOString(),
                end_date: null,
                reason: 'Assignment update',
                status: 'active'
              });
          }
        } catch (assignmentError) {
          console.error('Error updating assignment records:', assignmentError);
          // Continue anyway
        }
      }
      
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
      
      // First complete any active assignments
      try {
        await supabase
          .from('vehicle_assignments')
          .update({
            status: 'completed',
            end_date: new Date().toISOString()
          })
          .eq('vehicle_id', id)
          .eq('status', 'active');
      } catch (assignmentError) {
        console.error('Error completing assignments:', assignmentError);
        // Continue with deletion anyway
      }
      
      // Delete the vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting vehicle:', error);
        throw new Error(error.message || 'Failed to delete vehicle');
      }
      
      return true;
    } catch (error) {
      console.error(`Exception in deleteVehicle:`, error);
      throw error;
    }
  }
};

export default vehicleService;