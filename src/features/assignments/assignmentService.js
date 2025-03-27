// src/features/assignments/assignmentService.js
import supabase from '../../lib/supabase';

const assignmentService = {
  getAssignments: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number),
          driver:driver_id(id, name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(assignment => ({
        ...assignment,
        vehicle_plate: assignment.vehicle?.plate_number || 'Unknown',
        driver_name: assignment.driver?.name || 'Unassigned'
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },
  
  createAssignment: async (assignmentData) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: assignmentData.vehicle_id,
          driver_id: assignmentData.driver_id,
          start_date: assignmentData.start_date,
          end_date: assignmentData.end_date,
          reason: assignmentData.reason,
          status: 'active'
        })
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }
};

export default assignmentService;