import supabase from '../../../lib/supabase';
import { generatePassword } from '../../../lib/utils';

/**
 * Service for driver operations
 */
const DriverService = {
  /**
   * Get all drivers
   * @returns {Promise<Array>} List of drivers
   */
  getDrivers: async () => {
    console.log('[DRIVER] Fetching all drivers');
    try {
      // Try the direct query approach first as it's most reliable
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(*)
        `)
        .eq('role', 'driver')
        .order('name');
      
      if (error) {
        console.error('[DRIVER] Error fetching drivers:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('[DRIVER] Error fetching drivers:', error);
      throw error;
    }
  },

  /**
   * Get driver by ID
   * @param {string} id - Driver ID
   * @returns {Promise<Object>} Driver details
   */
  getDriverById: async (id) => {
    console.log(`[DRIVER] Fetching driver with ID: ${id}`);
    try {
      // Direct query for reliability
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`[DRIVER] Error fetching driver with ID ${id}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`[DRIVER] Error fetching driver with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search drivers by search term
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of drivers matching search
   */
  searchDrivers: async (searchTerm) => {
    console.log(`[DRIVER] Searching drivers with term: ${searchTerm}`);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(*)
        `)
        .eq('role', 'driver')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('name');
      
      if (error) {
        console.error(`[DRIVER] Error searching drivers:`, error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`[DRIVER] Error searching drivers:`, error);
      throw error;
    }
  },

  /**
   * Add a new driver
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} Created driver with password
   */
  addDriver: async (driverData) => {
    console.log('[DRIVER] Adding new driver:', driverData.name);
    try {
      // Generate a password if none is provided
      const password = driverData.password || generatePassword(10);
      
      // For direct creation, we'll use a two-step process
      // 1. Create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: driverData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: driverData.name
        }
      });
      
      if (authError) {
        console.error('[DRIVER] Auth user creation error:', authError);
        throw authError;
      }
      
      // 2. If the trigger didn't create the user for us, we'll do it manually
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select()
        .eq('auth_id', authData.user.id)
        .maybeSingle();
        
      if (userError) {
        console.error('[DRIVER] Error checking for user record:', userError);
        throw userError;
      }
      
      // If the user doesn't exist in the users table, create them
      if (!userData) {
        console.log('[DRIVER] User record not created by trigger, creating manually');
        
        // Get current admin user for created_by
        const { data: adminData } = await supabase.auth.getUser();
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            name: driverData.name,
            email: driverData.email,
            phone: driverData.phone || null,
            role: 'driver',
            created_by: adminData?.user?.id
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('[DRIVER] Error inserting user record:', insertError);
          throw insertError;
        }
        
        return { ...newUser, password };
      }
      
      return { ...userData, password };
    } catch (error) {
      console.error('[DRIVER] Error adding driver:', error);
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
    console.log(`[DRIVER] Updating driver with ID ${id}:`, driverData.name);
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
        console.error(`[DRIVER] Error updating driver:`, error);
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error(`[DRIVER] Error updating driver:`, error);
      throw error;
    }
  },

  /**
   * Delete a driver
   * @param {string} id - Driver ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteDriver: async (id) => {
    console.log(`[DRIVER] Deleting driver with ID: ${id}`);
    try {
      // First get the auth_id to delete from auth.users
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error(`[DRIVER] Error fetching driver auth_id:`, fetchError);
        throw fetchError;
      }
      
      // Now delete the auth user (which should cascade to the users table via trigger)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        userData.auth_id
      );
      
      if (deleteError) {
        console.error(`[DRIVER] Error deleting auth user:`, deleteError);
        throw deleteError;
      }
      
      return true;
    } catch (error) {
      console.error(`[DRIVER] Error deleting driver:`, error);
      throw error;
    }
  },

  /**
   * Reset driver's password
   * @param {string} id - Driver ID
   * @returns {Promise<Object>} Result with new password
   */
  resetPassword: async (id) => {
    console.log(`[DRIVER] Resetting password for driver with ID: ${id}`);
    try {
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id, email')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error(`[DRIVER] Error fetching driver auth_id:`, fetchError);
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
        console.error(`[DRIVER] Error updating password:`, updateError);
        throw updateError;
      }
      
      return { 
        success: true, 
        newPassword,
        email: userData.email
      };
    } catch (error) {
      console.error(`[DRIVER] Error resetting password:`, error);
      throw error;
    }
  }
};

export default DriverService;