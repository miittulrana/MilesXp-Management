import supabase from '../../../lib/supabase';

/**
 * Service for vehicle service records operations
 */
const ServiceService = {
  /**
   * Get all service records
   * @returns {Promise<Array>} Array of service records
   */
  getServiceRecords: async () => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching service records:', error);
      throw error;
    }
  },
  
  /**
   * Get service records by vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of service records
   */
  getServiceRecordsByVehicle: async (vehicleId) => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching service records for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get service record by ID
   * @param {string} id - Service record ID
   * @returns {Promise<Object>} Service record details
   */
  getServiceRecordById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching service record ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get vehicles due for service soon
   * @returns {Promise<Array>} Array of vehicles due for service
   */
  getVehiclesDueForService: async () => {
    try {
      // Try using the optimized function
      const { data: dueData, error: functionError } = await supabase
        .rpc('get_vehicles_due_for_service');
      
      if (!functionError && dueData) {
        return dueData;
      }
      
      // Fall back to regular query
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          id,
          vehicle_id,
          current_km,
          next_service_km,
          status,
          vehicle:vehicle_id(id, plate_number, model, assigned_to),
          driver:vehicle(id, name, email)
        `)
        .in('status', ['due_soon', 'overdue'])
        .order('current_km', { ascending: false });
      
      if (error) throw error;
      
      // Format data
      return data.map(record => ({
        ...record,
        km_remaining: record.next_service_km - record.current_km,
        plate_number: record.vehicle?.plate_number,
        model: record.vehicle?.model,
        driver_name: record.driver?.name,
        driver_email: record.driver?.email
      }));
    } catch (error) {
      console.error('Error fetching vehicles due for service:', error);
      throw error;
    }
  },
  
  /**
   * Add a new service record
   * @param {Object} serviceData - Service record data
   * @returns {Promise<Object>} Added service record
   */
  addServiceRecord: async (serviceData) => {
    try {
      // Try using the add_service_record function
      const { data: serviceData, error: functionError } = await supabase
        .rpc('add_service_record', {
          vehicle_id_val: serviceData.vehicle_id,
          last_service_km_val: serviceData.last_service_km,
          current_km_val: serviceData.current_km,
          service_date_val: serviceData.service_date,
          user_id: null // This would be the current user's ID
        });
      
      if (!functionError && serviceData) {
        return { id: serviceData };
      }
      
      // Fall back to regular insert
      const { data, error } = await supabase
        .from('service_records')
        .insert({
          vehicle_id: serviceData.vehicle_id,
          last_service_km: serviceData.last_service_km,
          current_km: serviceData.current_km,
          service_date: serviceData.service_date
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error adding service record:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing service record
   * @param {string} id - Service record ID
   * @param {Object} serviceData - Updated service record data
   * @returns {Promise<Object>} Updated service record
   */
  updateServiceRecord: async (id, serviceData) => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .update({
          last_service_km: serviceData.last_service_km,
          current_km: serviceData.current_km,
          service_date: serviceData.service_date
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error updating service record ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a service record
   * @param {string} id - Service record ID
   * @returns {Promise<void>}
   */
  deleteServiceRecord: async (id) => {
    try {
      const { error } = await supabase
        .from('service_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting service record ${id}:`, error);
      throw error;
    }
  }
};

export default ServiceService;