import supabase from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';

/**
 * Service for calendar-related operations
 */
const calendarService = {
  /**
   * Get calendar events for the specified date range
   * @param {Date} startDate - Start date for filtering
   * @param {Date} endDate - End date for filtering
   * @returns {Promise<Object>} Result object with data or error
   */
  async getCalendarEvents(startDate, endDate) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }
      
      const formattedStartDate = formatDate(startDate, 'YYYY-MM-DD');
      const formattedEndDate = formatDate(endDate, 'YYYY-MM-DD');
      
      const { data, error } = await supabase.rpc('get_calendar_events_optimized', {
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });
      
      if (error) throw error;
      
      // Transform data to event format
      const events = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        vehicleId: event.vehicle_id,
        vehiclePlate: event.vehicle_plate,
        driverId: event.driver_id,
        driverName: event.driver_name,
        eventType: event.event_type,
        reason: event.reason,
        createdBy: event.created_by,
        // Add color based on event type
        color: event.event_type === 'assignment' ? '#004d99' : '#ff7700', // primary for assignment, secondary for block
        textColor: '#ffffff',
        allDay: false
      }));
      
      return { data: events };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return { error };
    }
  },
  
  /**
   * Get active assignments for a vehicle
   * @param {string} vehicleId - ID of the vehicle
   * @returns {Promise<Object>} Result object with data or error
   */
  async getVehicleAssignments(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          id,
          start_date,
          end_date,
          reason,
          status,
          vehicles!inner(id, plate_number, model),
          users!vehicle_assignments_driver_id_fkey(id, name, email),
          users!vehicle_assignments_assigned_by_fkey(id, name)
        `)
        .eq('vehicle_id', vehicleId)
        .eq('status', 'active')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching vehicle assignments:', error);
      return { error };
    }
  },
  
  /**
   * Get active blocks for a vehicle
   * @param {string} vehicleId - ID of the vehicle
   * @returns {Promise<Object>} Result object with data or error
   */
  async getVehicleBlocks(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('vehicle_blocks')
        .select(`
          id,
          start_date,
          end_date,
          reason,
          status,
          vehicles!inner(id, plate_number, model),
          users!vehicle_blocks_blocked_by_fkey(id, name)
        `)
        .eq('vehicle_id', vehicleId)
        .eq('status', 'active')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching vehicle blocks:', error);
      return { error };
    }
  },
  
  /**
   * Get event details by ID and type
   * @param {string} eventId - ID of the event
   * @param {string} eventType - Type of event (assignment or block)
   * @returns {Promise<Object>} Result object with data or error
   */
  async getEventDetails(eventId, eventType) {
    try {
      let data, error;
      
      if (eventType === 'assignment') {
        ({ data, error } = await supabase
          .from('vehicle_assignments')
          .select(`
            id,
            start_date,
            end_date,
            reason,
            status,
            created_at,
            vehicles!inner(id, plate_number, model, year),
            users!vehicle_assignments_driver_id_fkey(id, name, email, phone),
            users!vehicle_assignments_assigned_by_fkey(id, name)
          `)
          .eq('id', eventId)
          .single());
      } else if (eventType === 'block') {
        ({ data, error } = await supabase
          .from('vehicle_blocks')
          .select(`
            id,
            start_date,
            end_date,
            reason,
            status,
            created_at,
            vehicles!inner(id, plate_number, model, year),
            users!vehicle_blocks_blocked_by_fkey(id, name)
          `)
          .eq('id', eventId)
          .single());
      } else {
        throw new Error('Invalid event type');
      }
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching event details:', error);
      return { error };
    }
  }
};

export default calendarService;