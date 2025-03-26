import supabase from '../../../lib/supabase';
import { ROLES } from '../../../lib/constants';
import { generatePassword } from '../../../lib/utils';

/**
 * Service for driver-related operations
 */
const DriverService = {
  /**
   * Get all drivers
   * @returns {Promise<Array>} Array of drivers
   */
  getDrivers: async () => {
    try {
      const { data: driversData, error: driversError } = await supabase
        .rpc('get_all_drivers_summary');
      
      if (driversError) {
        // Fallback to regular query if the function is not available
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            vehicle:vehicles!assigned_to(id, plate_number)
          `)
          .eq('role', ROLES.DRIVER)
          .order('name');
        
        if (error) throw error;
        
        // Format data
        return data.map(driver => ({
          ...driver,
          assigned_vehicle: driver.vehicle?.plate_number || null
        }));
      }
      
      return driversData;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },
  
  /**
   * Get driver by ID
   * @param {string} id - Driver ID
   * @returns {Promise<Object>} Driver details
   */
  getDriverById: async (id) => {
    try {
      // Try using the optimized function
      const { data: driverDetails, error: functionError } = await supabase
        .rpc('get_driver_details', { driver_id: id });
      
      if (!functionError && driverDetails) {
        return driverDetails;
      }
      
      // Fallback to regular query
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicle:vehicles!assigned_to(id, plate_number, model)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        assigned_vehicle: data.vehicle?.plate_number || null,
        assigned_vehicle_id: data.vehicle?.id || null
      };
    } catch (error) {
      console.error(`Error fetching driver ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a new driver
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} Added driver
   */
  addDriver: async (driverData) => {
    try {
      // Generate a random password if not provided
      const password = driverData.password || generatePassword(10);
      
      // Try using the create_user admin function
      const { data: userId, error: functionError } = await supabase
        .rpc('create_user', {
          user_email: driverData.email,
          user_password: password,
          user_name: driverData.name,
          user_phone: driverData.phone || null,
          user_role: ROLES.DRIVER,
          admin_id: null // This would be the current user's ID
        });
      
      if (functionError) {
        throw functionError;
      }
      
      return { id: userId, password };
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing driver
   * @param {string} id - Driver ID
   * @param {Object} driverData - Updated driver data
   * @returns {Promise<Object>} Updated driver
   */
  updateDriver: async (id, driverData) => {
    try {
      // Try using the update_user admin function
      const { data: success, error: functionError } = await supabase
        .rpc('update_user', {
          user_id: id,
          user_name: driverData.name,
          user_phone: driverData.phone || null,
          user_role: ROLES.DRIVER,
          admin_id: null // This would be the current user's ID
        });
      
      if (functionError) {
        throw functionError;
      }
      
      // If password change is requested
      if (driverData.password) {
        const { error: passwordError } = await supabase
          .rpc('reset_user_password', {
            user_id: id,
            new_password: driverData.password,
            admin_id: null // This would be the current user's ID
          });
        
        if (passwordError) {
          throw passwordError;
        }
      }
      
      // Get updated driver data
      const { data: updatedDriver, error: getError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      return updatedDriver;
    } catch (error) {
      console.error(`Error updating driver ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a driver
   * @param {string} id - Driver ID
   * @returns {Promise<void>}
   */
  deleteDriver: async (id) => {
    try {
      // Try using the delete_user admin function
      const { data: success, error: functionError } = await supabase
        .rpc('delete_user', {
          user_id: id,
          admin_id: null // This would be the current user's ID
        });
      
      if (functionError) {
        throw functionError;
      }
      
      if (!success) {
        throw new Error('Failed to delete driver');
      }
    } catch (error) {
      console.error(`Error deleting driver ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Reset driver password
   * @param {string} id - Driver ID
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  resetPassword: async (id, newPassword) => {
    try {
      const { error } = await supabase
        .rpc('reset_user_password', {
          user_id: id,
          new_password: newPassword,
          admin_id: null // This would be the current user's ID
        });
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error resetting password for driver ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Search drivers by text
   * @param {string} searchText - Search text
   * @returns {Promise<Array>} Array of matching drivers
   */
  searchDrivers: async (searchText) => {
    try {
      // Try using the search_drivers function
      const { data: searchData, error: searchError } = await supabase
        .rpc('search_drivers', { search_text: searchText });
      
      if (!searchError && searchData) {
        return searchData;
      }
      
      // Fallback to regular search
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicle:vehicles!assigned_to(id, plate_number)
        `)
        .eq('role', ROLES.DRIVER)
        .or(`name.ilike.%${searchText}%,email.ilike.%${searchText}%,phone.ilike.%${searchText}%`)
        .order('name');
      
      if (error) throw error;
      
      // Format data
      return data.map(driver => ({
        ...driver,
        assigned_vehicle: driver.vehicle?.plate_number || null
      }));
    } catch (error) {
      console.error('Error searching drivers:', error);
      throw error;
    }
  }
};

export default DriverService;