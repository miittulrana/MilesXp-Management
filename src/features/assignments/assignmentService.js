import supabase from '../../lib/supabase';

/**
 * Service for vehicle assignment operations
 */
const assignmentService = {
  /**
   * Get all assignments
   * @returns {Promise<Array>} List of assignments
   */
  getAssignments: async () => {
    try {
      console.log('Fetching vehicle assignments...');
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number),
          driver:driver_id(id, name),
          assigner:assigned_by(id, name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      
      console.log('Assignments fetched:', data?.length || 0);
      
      // Format data for UI
      return data.map(assignment => ({
        ...assignment,
        vehicle_plate: assignment.vehicle?.plate_number || 'Unknown',
        driver_name: assignment.driver?.name || 'Unassigned',
        assigner_name: assignment.assigner?.name || 'Unknown'
      }));
    } catch (error) {
      console.error('Exception in getAssignments:', error);
      throw error;
    }
  },
  
  /**
   * Get assignments by vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} List of assignments for the vehicle
   */
  getAssignmentsByVehicle: async (vehicleId) => {
    try {
      console.log(`Fetching assignments for vehicle ${vehicleId}...`);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          driver:driver_id(id, name),
          assigner:assigned_by(id, name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching assignments for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      console.log(`Assignments fetched for vehicle ${vehicleId}:`, data?.length || 0);
      
      // Format data for UI
      return data.map(assignment => ({
        ...assignment,
        driver_name: assignment.driver?.name || 'Unassigned',
        assigner_name: assignment.assigner?.name || 'Unknown'
      }));
    } catch (error) {
      console.error(`Exception in getAssignmentsByVehicle:`, error);
      throw error;
    }
  },
  
  /**
   * Get assignments by driver
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array>} List of assignments for the driver
   */
  getAssignmentsByDriver: async (driverId) => {
    try {
      console.log(`Fetching assignments for driver ${driverId}...`);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number),
          assigner:assigned_by(id, name)
        `)
        .eq('driver_id', driverId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching assignments for driver ${driverId}:`, error);
        throw error;
      }
      
      console.log(`Assignments fetched for driver ${driverId}:`, data?.length || 0);
      
      // Format data for UI
      return data.map(assignment => ({
        ...assignment,
        vehicle_plate: assignment.vehicle?.plate_number || 'Unknown',
        assigner_name: assignment.assigner?.name || 'Unknown'
      }));
    } catch (error) {
      console.error(`Exception in getAssignmentsByDriver:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Created assignment
   */
  createAssignment: async (assignmentData) => {
    try {
      console.log('Creating new assignment:', assignmentData);
      
      // Get the current user's ID
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
      
      // Create the assignment
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: assignmentData.vehicle_id,
          driver_id: assignmentData.driver_id,
          assigned_by: userData.id, // Current user's ID
          start_date: assignmentData.start_date,
          end_date: assignmentData.end_date,
          reason: assignmentData.reason,
          status: 'active'
        })
        .select();
      
      if (error) {
        console.error('Error creating assignment:', error);
        throw error;
      }
      
      console.log('Assignment created successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Exception in createAssignment:', error);
      throw error;
    }
  },
  
  /**
   * Update an assignment
   * @param {string} id - Assignment ID
   * @param {Object} assignmentData - Assignment data to update
   * @returns {Promise<Object>} Updated assignment
   */
  updateAssignment: async (id, assignmentData) => {
    try {
      console.log('Updating assignment ID:', id, assignmentData);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .update({
          start_date: assignmentData.start_date,
          end_date: assignmentData.end_date,
          reason: assignmentData.reason,
          status: assignmentData.status
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating assignment:', error);
        throw error;
      }
      
      console.log('Assignment updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateAssignment:`, error);
      throw error;
    }
  },
  
  /**
   * Complete an assignment
   * @param {string} id - Assignment ID
   * @returns {Promise<Object>} Updated assignment
   */
  completeAssignment: async (id) => {
    try {
      console.log('Completing assignment ID:', id);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .update({
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error completing assignment:', error);
        throw error;
      }
      
      console.log('Assignment completed successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in completeAssignment:`, error);
      throw error;
    }
  },
  
  /**
   * Cancel an assignment
   * @param {string} id - Assignment ID
   * @returns {Promise<Object>} Updated assignment
   */
  cancelAssignment: async (id) => {
    try {
      console.log('Cancelling assignment ID:', id);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .update({
          status: 'cancelled',
          end_date: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error cancelling assignment:', error);
        throw error;
      }
      
      console.log('Assignment cancelled successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in cancelAssignment:`, error);
      throw error;
    }
  }
};

export default assignmentService;