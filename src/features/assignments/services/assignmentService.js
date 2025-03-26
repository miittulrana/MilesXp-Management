import supabase from '../../../lib/supabase';
import { ASSIGNMENT_STATUS } from '../../../lib/constants';

/**
 * Service for vehicle assignment operations
 */
const AssignmentService = {
  /**
   * Get all vehicle assignments
   * @returns {Promise<Array>} Array of assignments
   */
  getAssignments: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          driver:driver_id(id, name, email),
          assigner:assigned_by(id, name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Format data to include relevant information
      return data.map(assignment => ({
        ...assignment,
        vehicle_plate: assignment.vehicle ? assignment.vehicle.plate_number : null,
        vehicle_model: assignment.vehicle ? assignment.vehicle.model : null,
        driver_name: assignment.driver ? assignment.driver.name : null,
        driver_email: assignment.driver ? assignment.driver.email : null,
        assigned_by_name: assignment.assigner ? assignment.assigner.name : null
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },
  
  /**
   * Get assignments for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of assignments
   */
  getAssignmentsByVehicle: async (vehicleId) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          driver:driver_id(id, name, email),
          assigner:assigned_by(id, name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Format data
      return data.map(assignment => ({
        ...assignment,
        vehicle_plate: assignment.vehicle ? assignment.vehicle.plate_number : null,
        vehicle_model: assignment.vehicle ? assignment.vehicle.model : null,
        driver_name: assignment.driver ? assignment.driver.name : null,
        driver_email: assignment.driver ? assignment.driver.email : null,
        assigned_by_name: assignment.assigner ? assignment.assigner.name : null
      }));
    } catch (error) {
      console.error(`Error fetching assignments for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get assignments for a specific driver
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array>} Array of assignments
   */
  getAssignmentsByDriver: async (driverId) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          driver:driver_id(id, name, email),
          assigner:assigned_by(id, name)
        `)
        .eq('driver_id', driverId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Format data
      return data.map(assignment => ({
        ...assignment,
        vehicle_plate: assignment.vehicle ? assignment.vehicle.plate_number : null,
        vehicle_model: assignment.vehicle ? assignment.vehicle.model : null,
        driver_name: assignment.driver ? assignment.driver.name : null,
        driver_email: assignment.driver ? assignment.driver.email : null,
        assigned_by_name: assignment.assigner ? assignment.assigner.name : null
      }));
    } catch (error) {
      console.error(`Error fetching assignments for driver ${driverId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a specific assignment by ID
   * @param {string} id - Assignment ID
   * @returns {Promise<Object>} Assignment details
   */
  getAssignmentById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model),
          driver:driver_id(id, name, email),
          assigner:assigned_by(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Format data
      return {
        ...data,
        vehicle_plate: data.vehicle ? data.vehicle.plate_number : null,
        vehicle_model: data.vehicle ? data.vehicle.model : null,
        driver_name: data.driver ? data.driver.name : null,
        driver_email: data.driver ? data.driver.email : null,
        assigned_by_name: data.assigner ? data.assigner.name : null
      };
    } catch (error) {
      console.error(`Error fetching assignment ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new vehicle assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Created assignment
   */
  createAssignment: async (assignmentData) => {
    try {
      // Try using the optimized function if available
      const { data: assignmentId, error: functionError } = await supabase
        .rpc('create_temp_vehicle_assignment', {
          v_id: assignmentData.vehicle_id,
          d_id: assignmentData.driver_id,
          admin_id: null, // This would be the current user's ID
          start_time: assignmentData.start_date,
          end_time: assignmentData.end_date,
          assignment_reason: assignmentData.reason
        });
      
      if (!functionError && assignmentId) {
        return { id: assignmentId };
      }
      
      // Fall back to regular insert
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: assignmentData.vehicle_id,
          driver_id: assignmentData.driver_id,
          assigned_by: null, // This would be the current user's ID
          start_date: assignmentData.start_date,
          end_date: assignmentData.end_date,
          reason: assignmentData.reason,
          status: ASSIGNMENT_STATUS.ACTIVE
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing vehicle assignment
   * @param {string} id - Assignment ID
   * @param {Object} assignmentData - Updated assignment data
   * @returns {Promise<Object>} Updated assignment
   */
  updateAssignment: async (id, assignmentData) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .update({
          start_date: assignmentData.start_date,
          end_date: assignmentData.end_date,
          reason: assignmentData.reason
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error updating assignment ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Update assignment status (complete/cancel)
   * @param {string} id - Assignment ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated assignment
   */
  updateAssignmentStatus: async (id, status) => {
    try {
      if (!Object.values(ASSIGNMENT_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .update({
          status: status
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error updating assignment status ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get active assignments for a date range (for calendar)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of assignments
   */
  getCalendarEvents: async (startDate, endDate) => {
    try {
      // Format dates as required by Supabase
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Try using the optimized function if available
      const { data: calendarData, error: functionError } = await supabase
        .rpc('get_calendar_events', {
          start_date: formattedStartDate,
          end_date: formattedEndDate
        });
      
      if (!functionError && calendarData) {
        return calendarData;
      }
      
      // Fall back to regular query for assignments and blocks
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('vehicle_assignments')
        .select(`
          id,
          vehicle_id,
          driver_id,
          start_date,
          end_date,
          reason,
          status,
          vehicle:vehicle_id(plate_number),
          driver:driver_id(name),
          assigner:assigned_by(name)
        `)
        .gte('end_date', formattedStartDate)
        .lte('start_date', formattedEndDate)
        .eq('status', ASSIGNMENT_STATUS.ACTIVE);
      
      if (assignmentsError) throw assignmentsError;
      
      // Format assignment data for calendar
      const formattedAssignments = assignmentsData.map(assignment => ({
        id: assignment.id,
        title: `${assignment.vehicle.plate_number} - ${assignment.driver.name}`,
        start: assignment.start_date,
        end: assignment.end_date,
        vehicle_id: assignment.vehicle_id,
        vehicle_plate: assignment.vehicle.plate_number,
        driver_id: assignment.driver_id,
        driver_name: assignment.driver.name,
        reason: assignment.reason,
        type: 'assignment',
        created_by: assignment.assigner.name
      }));
      
      // Get block events too (would be implemented in blockService)
      // ... 
      
      return formattedAssignments;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }
};

export default AssignmentService;