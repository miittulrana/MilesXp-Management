import supabase from '../../lib/supabase';

/**
 * Service for vehicle block operations
 */
const blockService = {
  /**
   * Get all blocks
   * @returns {Promise<Array>} List of blocks
   */
  getBlocks: async () => {
    try {
      console.log('Fetching vehicle blocks...');
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number),
          blocker:blocked_by(id, name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching blocks:', error);
        throw error;
      }
      
      console.log('Blocks fetched:', data?.length || 0);
      
      // Format data for UI
      return data.map(block => ({
        ...block,
        vehicle_plate: block.vehicle?.plate_number || 'Unknown',
        blocker_name: block.blocker?.name || 'Unknown'
      }));
    } catch (error) {
      console.error('Exception in getBlocks:', error);
      throw error;
    }
  },
  
  /**
   * Get blocks by vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} List of blocks for the vehicle
   */
  getBlocksByVehicle: async (vehicleId) => {
    try {
      console.log(`Fetching blocks for vehicle ${vehicleId}...`);
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          *,
          blocker:blocked_by(id, name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching blocks for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      console.log(`Blocks fetched for vehicle ${vehicleId}:`, data?.length || 0);
      
      // Format data for UI
      return data.map(block => ({
        ...block,
        blocker_name: block.blocker?.name || 'Unknown'
      }));
    } catch (error) {
      console.error(`Exception in getBlocksByVehicle:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new block
   * @param {Object} blockData - Block data
   * @returns {Promise<Object>} Created block
   */
  createBlock: async (blockData) => {
    try {
      console.log('Creating new vehicle block:', blockData);
      
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
      
      // Create the block
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .insert({
          vehicle_id: blockData.vehicle_id,
          blocked_by: userData.id, // Current user's ID
          start_date: blockData.start_date,
          end_date: blockData.end_date,
          reason: blockData.reason,
          status: 'active'
        })
        .select();
      
      if (error) {
        console.error('Error creating block:', error);
        throw error;
      }
      
      console.log('Block created successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Exception in createBlock:', error);
      throw error;
    }
  },
  
  /**
   * Update a block
   * @param {string} id - Block ID
   * @param {Object} blockData - Block data to update
   * @returns {Promise<Object>} Updated block
   */
  updateBlock: async (id, blockData) => {
    try {
      console.log('Updating block ID:', id, blockData);
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .update({
          start_date: blockData.start_date,
          end_date: blockData.end_date,
          reason: blockData.reason,
          status: blockData.status
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating block:', error);
        throw error;
      }
      
      console.log('Block updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateBlock:`, error);
      throw error;
    }
  },
  
  /**
   * Complete a block
   * @param {string} id - Block ID
   * @returns {Promise<Object>} Updated block
   */
  completeBlock: async (id) => {
    try {
      console.log('Completing block ID:', id);
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .update({
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error completing block:', error);
        throw error;
      }
      
      console.log('Block completed successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in completeBlock:`, error);
      throw error;
    }
  }
};

export default blockService;