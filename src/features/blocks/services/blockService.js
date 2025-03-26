import supabase from '../../../lib/supabase';
import { BLOCK_STATUS } from '../../../lib/constants';

/**
 * Service for vehicle block operations
 */
const BlockService = {
  /**
   * Get all vehicle blocks
   * @returns {Promise<Array>} Array of blocks
   */
  getBlocks: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          blocker:blocked_by(id, name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Format data
      return data.map(block => ({
        ...block,
        vehicle_plate: block.vehicle ? block.vehicle.plate_number : null,
        vehicle_model: block.vehicle ? block.vehicle.model : null,
        blocked_by_name: block.blocker ? block.blocker.name : null
      }));
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  },
  
  /**
   * Get blocks for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of blocks
   */
  getBlocksByVehicle: async (vehicleId) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          blocker:blocked_by(id, name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Format data
      return data.map(block => ({
        ...block,
        vehicle_plate: block.vehicle ? block.vehicle.plate_number : null,
        vehicle_model: block.vehicle ? block.vehicle.model : null,
        blocked_by_name: block.blocker ? block.blocker.name : null
      }));
    } catch (error) {
      console.error(`Error fetching blocks for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a specific block by ID
   * @param {string} id - Block ID
   * @returns {Promise<Object>} Block details
   */
  getBlockById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          blocker:blocked_by(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Format data
      return {
        ...data,
        vehicle_plate: data.vehicle ? data.vehicle.plate_number : null,
        vehicle_model: data.vehicle ? data.vehicle.model : null,
        blocked_by_name: data.blocker ? data.blocker.name : null
      };
    } catch (error) {
      console.error(`Error fetching block ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new vehicle block
   * @param {Object} blockData - Block data
   * @returns {Promise<Object>} Created block
   */
  createBlock: async (blockData) => {
    try {
      // Try using the optimized function if available
      const { data: blockId, error: functionError } = await supabase
        .rpc('block_vehicle', {
          v_id: blockData.vehicle_id,
          admin_id: null, // This would be the current user's ID
          start_time: blockData.start_date,
          end_time: blockData.end_date,
          block_reason: blockData.reason
        });
      
      if (!functionError && blockId) {
        return { id: blockId };
      }
      
      // Fall back to regular insert
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .insert({
          vehicle_id: blockData.vehicle_id,
          blocked_by: null, // This would be the current user's ID
          start_date: blockData.start_date,
          end_date: blockData.end_date,
          reason: blockData.reason,
          status: BLOCK_STATUS.ACTIVE
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update vehicle status to 'blocked'
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ status: 'blocked' })
        .eq('id', blockData.vehicle_id);
      
      if (updateError) {
        console.error('Error updating vehicle status:', updateError);
        // Continue anyway, don't fail the whole operation
      }
      
      return data;
    } catch (error) {
      console.error('Error creating block:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing vehicle block
   * @param {string} id - Block ID
   * @param {Object} blockData - Updated block data
   * @returns {Promise<Object>} Updated block
   */
  updateBlock: async (id, blockData) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .update({
          start_date: blockData.start_date,
          end_date: blockData.end_date,
          reason: blockData.reason
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error updating block ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Complete a vehicle block (end it early)
   * @param {string} id - Block ID
   * @returns {Promise<Object>} Updated block
   */
  completeBlock: async (id) => {
    try {
      // Get the block to find the vehicle ID
      const { data: block, error: getError } = await supabase
        .from('vehicle_blocks')
        .select('vehicle_id')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      // Update the block status
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .update({
          status: BLOCK_STATUS.COMPLETED,
          end_date: new Date().toISOString() // End it now
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update vehicle status back to 'available' if it was blocked
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', block.vehicle_id)
        .eq('status', 'blocked'); // Only update if it's still blocked
      
      if (updateError) {
        console.error('Error updating vehicle status:', updateError);
        // Continue anyway, don't fail the whole operation
      }
      
      return data;
    } catch (error) {
      console.error(`Error completing block ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get active blocks for calendar
   * @param {Date} startDate - Calendar start date
   * @param {Date} endDate - Calendar end date
   * @returns {Promise<Array>} Blocks formatted for calendar
   */
  getCalendarBlocks: async (startDate, endDate) => {
    try {
      // Format dates
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get blocks that overlap with the date range
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          id,
          vehicle_id,
          start_date,
          end_date,
          reason,
          status,
          vehicle:vehicle_id(plate_number),
          blocker:blocked_by(name)
        `)
        .gte('end_date', formattedStartDate)
        .lte('start_date', formattedEndDate)
        .eq('status', BLOCK_STATUS.ACTIVE);
      
      if (error) throw error;
      
      // Format for calendar
      return data.map(block => ({
        id: block.id,
        title: `Blocked: ${block.vehicle.plate_number}`,
        start: block.start_date,
        end: block.end_date,
        vehicle_id: block.vehicle_id,
        vehicle_plate: block.vehicle.plate_number,
        reason: block.reason,
        type: 'block',
        created_by: block.blocker.name
      }));
    } catch (error) {
      console.error('Error fetching calendar blocks:', error);
      throw error;
    }
  }
};

export default BlockService;