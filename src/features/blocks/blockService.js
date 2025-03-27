// src/features/blocks/blockService.js
import supabase from '../../lib/supabase';

const blockService = {
  getBlocks: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(block => ({
        ...block,
        vehicle_plate: block.vehicle?.plate_number || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  },
  
  createBlock: async (blockData) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .insert({
          vehicle_id: blockData.vehicle_id,
          start_date: blockData.start_date,
          end_date: blockData.end_date,
          reason: blockData.reason,
          status: 'active'
        })
        .select();
      
      if (error) throw error;
      
      // Update vehicle status to 'blocked'
      await supabase
        .from('vehicles')
        .update({ status: 'blocked' })
        .eq('id', blockData.vehicle_id);
      
      return data[0];
    } catch (error) {
      console.error('Error creating block:', error);
      throw error;
    }
  },
  
  completeBlock: async (blockId) => {
    try {
      // Get the block to find the vehicle ID
      const { data: block } = await supabase
        .from('vehicle_blocks')
        .select('vehicle_id')
        .eq('id', blockId)
        .single();
      
      // Update the block status
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .update({
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', blockId)
        .select();
      
      if (error) throw error;
      
      // Update vehicle status back to 'available'
      await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', block.vehicle_id);
      
      return data[0];
    } catch (error) {
      console.error('Error completing block:', error);
      throw error;
    }
  }
};

export default blockService;