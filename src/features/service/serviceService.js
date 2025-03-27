import supabase from '../../lib/supabase';
import { SERVICE_CONSTANTS } from '../../lib/constants';

/**
 * Service for vehicle service records operations
 */
const serviceService = {
  /**
   * Get all service records
   * @returns {Promise<Array>} List of service records
   */
  getServiceRecords: async () => {
    try {
      console.log('Fetching service records...');
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number)
        `)
        .order('service_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching service records:', error);
        throw error;
      }
      
      console.log('Service records fetched:', data?.length || 0);
      
      // Process service records to include status and remaining kilometers
      return data.map(record => {
        // Calculate km remaining and status
        const kmRemaining = record.next_service_km - record.current_km;
        let status = 'completed';
        
        if (kmRemaining <= 0) {
          status = 'overdue';
        } else if (kmRemaining <= SERVICE_CONSTANTS.SERVICE_WARNING_KM) {
          status = 'due_soon';
        }
        
        return {
          ...record,
          vehicle_plate: record.vehicle?.plate_number || 'Unknown',
          km_remaining: kmRemaining,
          status
        };
      });
    } catch (error) {
      console.error('Exception in getServiceRecords:', error);
      throw error;
    }
  },
  
  /**
   * Get service records by vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} List of service records for the vehicle
   */
  getServiceRecordsByVehicle: async (vehicleId) => {
    try {
      console.log(`Fetching service records for vehicle ${vehicleId}...`);
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching service records for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      console.log(`Service records fetched for vehicle ${vehicleId}:`, data?.length || 0);
      
      // Process service records to include status and remaining kilometers
      return data.map(record => {
        // Calculate km remaining and status
        const kmRemaining = record.next_service_km - record.current_km;
        let status = 'completed';
        
        if (kmRemaining <= 0) {
          status = 'overdue';
        } else if (kmRemaining <= SERVICE_CONSTANTS.SERVICE_WARNING_KM) {
          status = 'due_soon';
        }
        
        return {
          ...record,
          km_remaining: kmRemaining,
          status
        };
      });
    } catch (error) {
      console.error(`Exception in getServiceRecordsByVehicle:`, error);
      throw error;
    }
  },
  
  /**
   * Get latest service record by vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Latest service record for the vehicle
   */
  getLatestServiceRecord: async (vehicleId) => {
    try {
      console.log(`Fetching latest service record for vehicle ${vehicleId}...`);
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log(`No service records found for vehicle ${vehicleId}`);
          return null;
        }
        
        console.error(`Error fetching latest service record for vehicle ${vehicleId}:`, error);
        throw error;
      }
      
      console.log(`Latest service record fetched for vehicle ${vehicleId}:`, data?.id);
      
      // Calculate km remaining and status
      const kmRemaining = data.next_service_km - data.current_km;
      let status = 'completed';
      
      if (kmRemaining <= 0) {
        status = 'overdue';
      } else if (kmRemaining <= SERVICE_CONSTANTS.SERVICE_WARNING_KM) {
        status = 'due_soon';
      }
      
      return {
        ...data,
        km_remaining: kmRemaining,
        status
      };
    } catch (error) {
      console.error(`Exception in getLatestServiceRecord:`, error);
      throw error;
    }
  },
  
  /**
   * Add a new service record
   * @param {Object} serviceData - Service record data
   * @returns {Promise<Object>} Created service record
   */
  addServiceRecord: async (serviceData) => {
    try {
      console.log('Adding new service record:', serviceData);
      
      // Calculate next service kilometer
      const nextServiceKm = parseInt(serviceData.current_km) + SERVICE_CONSTANTS.NEXT_SERVICE_KM;
      
      // Create the service record
      const { data, error } = await supabase
        .from('service_records')
        .insert({
          vehicle_id: serviceData.vehicle_id,
          last_service_km: serviceData.last_service_km || 0,
          current_km: serviceData.current_km,
          next_service_km: serviceData.next_service_km || nextServiceKm,
          service_date: serviceData.service_date || new Date().toISOString(),
          notes: serviceData.notes || ''
        })
        .select();
      
      if (error) {
        console.error('Error creating service record:', error);
        throw error;
      }
      
      console.log('Service record created successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Exception in addServiceRecord:', error);
      throw error;
    }
  },
  
  /**
   * Update a service record
   * @param {string} id - Service record ID
   * @param {Object} serviceData - Service record data to update
   * @returns {Promise<Object>} Updated service record
   */
  updateServiceRecord: async (id, serviceData) => {
    try {
      console.log('Updating service record ID:', id, serviceData);
      
      // Prepare update object
      const updateData = {};
      
      // Only include fields that are provided
      if (serviceData.last_service_km !== undefined) updateData.last_service_km = serviceData.last_service_km;
      if (serviceData.current_km !== undefined) updateData.current_km = serviceData.current_km;
      if (serviceData.next_service_km !== undefined) updateData.next_service_km = serviceData.next_service_km;
      if (serviceData.service_date !== undefined) updateData.service_date = serviceData.service_date;
      if (serviceData.notes !== undefined) updateData.notes = serviceData.notes;
      
      // Update the service record
      const { data, error } = await supabase
        .from('service_records')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating service record:', error);
        throw error;
      }
      
      console.log('Service record updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateServiceRecord:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a service record
   * @param {string} id - Service record ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteServiceRecord: async (id) => {
    try {
      console.log('Deleting service record ID:', id);
      const { error } = await supabase
        .from('service_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting service record:', error);
        throw error;
      }
      
      console.log('Service record deleted successfully');
      return true;
    } catch (error) {
      console.error(`Exception in deleteServiceRecord:`, error);
      throw error;
    }
  }
};

export default serviceService;