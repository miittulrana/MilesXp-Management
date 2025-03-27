// src/features/service/serviceService.js
import supabase from '../../lib/supabase';

// Constant for determining next service
const NEXT_SERVICE_KM = 5000;

const serviceService = {
  getServiceRecords: async () => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(record => {
        // Calculate status based on distance to next service
        const kmRemaining = record.next_service_km - record.current_km;
        let status = 'completed';
        
        if (kmRemaining <= 0) {
          status = 'overdue';
        } else if (kmRemaining <= 500) {
          status = 'due_soon';
        }
        
        return {
          ...record,
          vehicle_plate: record.vehicle?.plate_number,
          status
        };
      });
    } catch (error) {
      console.error('Error fetching service records:', error);
      throw error;
    }
  },
  
  getServiceRecordsByVehicle: async (vehicleId) => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(record => {
        // Calculate status based on distance to next service
        const kmRemaining = record.next_service_km - record.current_km;
        let status = 'completed';
        
        if (kmRemaining <= 0) {
          status = 'overdue';
        } else if (kmRemaining <= 500) {
          status = 'due_soon';
        }
        
        return {
          ...record,
          status
        };
      });
    } catch (error) {
      console.error(`Error fetching service records for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
  addServiceRecord: async (serviceData) => {
    try {
      // Calculate next service KM
      const nextServiceKm = parseInt(serviceData.current_km) + NEXT_SERVICE_KM;
      
      const { data, error } = await supabase
        .from('service_records')
        .insert({
          vehicle_id: serviceData.vehicle_id,
          last_service_km: serviceData.last_service_km,
          current_km: serviceData.current_km,
          next_service_km: nextServiceKm,
          service_date: serviceData.service_date
        })
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error adding service record:', error);
      throw error;
    }
  }
};

export default serviceService;