import supabase from '../../lib/supabase';
import { generatePassword } from '../../lib/utils';

/**
 * Service for driver operations - Simplified version
 */
const driverService = {
  /**
   * Get all drivers
   * @returns {Promise<Array>} List of drivers
   */
  getDrivers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(*)
        `)
        .eq('role', 'driver')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      // Format data for UI
      return data.map(driver => ({
        ...driver,
        assigned_vehicle: driver.vehicles?.plate_number || null
      }));
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
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format data for UI
      return {
        ...data,
        assigned_vehicle: data.vehicles?.plate_number || null,
        assigned_vehicle_id: data.vehicles?.id || null
      };
    } catch (error) {
      console.error(`Error fetching driver with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add a new driver
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} Created driver
   */
  addDriver: async (driverData) => {
    try {
      // Generate a password if none is provided
      const password = driverData.password || generatePassword(10);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: driverData.email,
        password: password,
        email_confirm: true
      });
      
      if (authError) {
        throw authError;
      }
      
      // Create user record
      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone || null,
          role: 'driver'
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      return { ...data[0], password };
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  },

  /**
   * Update a driver
   * @param {string} id - Driver ID
   * @param {Object} driverData - Driver data to update
   * @returns {Promise<Object>} Updated driver
   */
  updateDriver: async (id, driverData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: driverData.name,
          phone: driverData.phone || null
        })
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error(`Error updating driver:`, error);
      throw error;
    }
  },

  /**
   * Delete a driver
   * @param {string} id - Driver ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteDriver: async (id) => {
    try {
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Delete the auth user which should cascade to the users table
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        userData.auth_id
      );
      
      if (deleteError) {
        throw deleteError;
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting driver:`, error);
      throw error;
    }
  },

  /**
   * Reset driver's password
   * @param {string} id - Driver ID
   * @returns {Promise<Object>} Result with new password
   */
  resetPassword: async (id) => {
    try {
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Generate a new password
      const newPassword = generatePassword(12);
      
      // Update the password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userData.auth_id,
        { password: newPassword }
      );
      
      if (updateError) {
        throw updateError;
      }
      
      return { success: true, newPassword };
    } catch (error) {
      console.error(`Error resetting password:`, error);
      throw error;
    }
  }
};

export default driverService;