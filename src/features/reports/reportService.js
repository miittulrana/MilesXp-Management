// src/features/reports/reportService.js
import supabase from '../../lib/supabase';

const reportService = {
  generateVehicleReport: async (startDate = null, endDate = null) => {
    try {
      // In a real implementation, this would call a backend function
      // For this simplified version, we'll just fetch basic vehicle data
      
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate_number,
          model,
          year,
          status,
          users:assigned_to(id, name)
        `)
        .order('plate_number');
      
      if (error) throw error;
      
      // Transform data to report format
      const reportData = data.map(vehicle => ({
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
        driver_name: vehicle.users?.name || 'Unassigned',
        document_status: 'valid', // Mocked
        service_status: 'completed', // Mocked
        total_assignments: Math.floor(Math.random() * 10) // Mocked
      }));
      
      return { data: reportData };
    } catch (error) {
      console.error('Error generating vehicle report:', error);
      return { error };
    }
  },
  
  generateDriverReport: async (startDate = null, endDate = null) => {
    try {
      // Get driver data
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          role
        `)
        .eq('role', 'driver')
        .order('name');
      
      if (error) throw error;
      
      // Transform data to report format
      const reportData = data.map(driver => ({
        driver_name: driver.name,
        email: driver.email,
        phone: driver.phone || '-',
        document_status: 'valid', // Mocked
        assigned_vehicle: 'None', // Mocked
        total_assignments: Math.floor(Math.random() * 10), // Mocked
        total_km_driven: Math.floor(Math.random() * 1000) // Mocked
      }));
      
      return { data: reportData };
    } catch (error) {
      console.error('Error generating driver report:', error);
      return { error };
    }
  },
  
  generateDocumentStatusReport: async () => {
    try {
      // Get document data
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          type,
          entity_type,
          entity_id,
          issue_date,
          expiry_date
        `)
        .order('expiry_date');
      
      if (error) throw error;
      
      // Transform data to report format
      const reportData = data.map(doc => {
        // Calculate days remaining
        const today = new Date();
        const expiryDate = new Date(doc.expiry_date);
        const daysRemaining = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Determine status
        let status = 'valid';
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining < 30) {
          status = 'expiring_soon';
        }
        
        return {
          name: doc.name,
          type: doc.type,
          entity_name: `${doc.entity_type}-${doc.entity_id}`, // Simplified
          expiry_date: doc.expiry_date,
          days_remaining: daysRemaining,
          status
        };
      });
      
      return { data: reportData };
    } catch (error) {
      console.error('Error generating document status report:', error);
      return { error };
    }
  },
  
  generateServiceDueReport: async () => {
    try {
      // Get service records
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          id,
          vehicle_id,
          last_service_km,
          current_km,
          next_service_km,
          service_date,
          vehicle:vehicle_id(plate_number)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to report format
      const reportData = data.map(record => {
        // Calculate km remaining
        const kmRemaining = record.next_service_km - record.current_km;
        
        // Determine status
        let status = 'completed';
        if (kmRemaining <= 0) {
          status = 'overdue';
        } else if (kmRemaining <= 500) {
          status = 'due_soon';
        }
        
        return {
          plate_number: record.vehicle?.plate_number || 'Unknown',
          current_km: record.current_km,
          next_service_km: record.next_service_km,
          km_remaining: kmRemaining,
          status
        };
      });
      
      return { data: reportData };
    } catch (error) {
      console.error('Error generating service due report:', error);
      return { error };
    }
  },
  
  generateVehicleLogsReport: async (vehicleId, startDate, endDate) => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // Get assignment logs
      const { data, error } = await supabase
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
          driver:driver_id(name)
        `)
        .eq('vehicle_id', vehicleId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to report format
      const reportData = data.map(log => {
        // Calculate duration
        const start = new Date(log.start_date);
        const end = new Date(log.end_date);
        const durationMs = end - start;
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const duration = `${days}d ${hours}h`;
        
        return {
          vehicle_plate: log.vehicle?.plate_number || 'Unknown',
          driver_name: log.driver?.name || 'Unassigned',
          start_time: new Date(log.start_date).toLocaleString(),
          end_time: new Date(log.end_date).toLocaleString(),
          duration,
          reason: log.reason || '-'
        };
      });
      
      return { data: reportData };
    } catch (error) {
      console.error('Error generating vehicle logs report:', error);
      return { error };
    }
  },
  
  downloadReportCSV: (data, reportType) => {
    try {
      if (!data || !data.length) return;
      
      // Create CSV content
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).map(value => {
        // Handle values that might contain commas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','));
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw error;
    }
  }
};

export default reportService;