import supabase from '../../lib/supabase';
import { generatePassword } from '../../lib/utils';

/**
 * Service for driver operations
 */
const driverService = {
  /**
   * Get all drivers
   * @returns {Promise<Array>} List of drivers
   */
  getDrivers: async () => {
    try {
      console.log('Fetching drivers...');
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(id, plate_number, model, year)
        `)
        .eq('role', 'driver')
        .order('name');
      
      if (error) {
        console.error('Error fetching drivers:', error);
        throw error;
      }
      
      console.log('Drivers fetched:', data?.length || 0);
      
      // Format data for UI
      return data.map(driver => ({
        ...driver,
        assigned_vehicle: driver.vehicles?.plate_number || null
      }));
    } catch (error) {
      console.error('Exception in getDrivers:', error);
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
      console.log('Fetching driver details for ID:', id);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(id, plate_number, model, year)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching driver details:', error);
        throw error;
      }
      
      console.log('Driver details fetched:', data?.id);
      
      // Format data for UI
      return {
        ...data,
        assigned_vehicle: data.vehicles?.plate_number || null,
        assigned_vehicle_id: data.vehicles?.id || null
      };
    } catch (error) {
      console.error(`Exception in getDriverById:`, error);
      throw error;
    }
  },

  /**
   * Get driver by auth ID
   * @param {string} authId - Auth ID
   * @returns {Promise<Object>} Driver details
   */
  getDriverByAuthId: async (authId) => {
    try {
      console.log('Fetching driver details for auth ID:', authId);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          vehicles(id, plate_number, model, year)
        `)
        .eq('auth_id', authId)
        .single();
      
      if (error) {
        console.error('Error fetching driver details by auth ID:', error);
        throw error;
      }
      
      console.log('Driver details fetched by auth ID:', data?.id);
      
      // Format data for UI
      return {
        ...data,
        assigned_vehicle: data.vehicles?.plate_number || null,
        assigned_vehicle_id: data.vehicles?.id || null
      };
    } catch (error) {
      console.error(`Exception in getDriverByAuthId:`, error);
      throw error;
    }
  },

  /**
   * Get available drivers (not assigned to any vehicle)
   * @returns {Promise<Array>} List of available drivers
   */
  getAvailableDrivers: async () => {
    try {
      console.log('Fetching available drivers');
      
      // Fetch drivers that don't have a vehicle assigned to them
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
        .not('id', 'in', supabase
          .from('vehicles')
          .select('assigned_to')
          .not('assigned_to', 'is', null)
        )
        .order('name');
      
      if (error) {
        console.error('Error fetching available drivers:', error);
        throw error;
      }
      
      console.log('Available drivers fetched:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('Exception in getAvailableDrivers:', error);
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
      console.log('Adding new driver:', driverData);
      
      // Generate a password if none is provided
      const password = driverData.password || generatePassword(10);
      
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: driverData.email,
        password: password,
        options: {
          data: {
            name: driverData.name,
            role: 'driver'
          }
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }
      
      if (!authData?.user) {
        throw new Error('Auth user creation failed');
      }
      
      console.log('Auth user created:', authData.user.id);
      
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
        console.error('Error creating driver record:', error);
        
        // Clean up auth user if user table insert fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Error cleaning up auth user:', cleanupError);
        }
        
        throw error;
      }
      
      console.log('Driver record created:', data[0]?.id);
      
      // Return the created driver with the generated password
      return { ...data[0], password };
    } catch (error) {
      console.error('Exception in addDriver:', error);
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
      console.log('Updating driver ID:', id, driverData);
      
      // Prepare update data
      const updateData = {};
      if (driverData.name !== undefined) updateData.name = driverData.name;
      if (driverData.phone !== undefined) updateData.phone = driverData.phone;
      
      // Update the driver record
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating driver:', error);
        throw error;
      }
      
      console.log('Driver updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateDriver:`, error);
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
      console.log('Deleting driver ID:', id);
      
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching driver auth_id:', fetchError);
        throw fetchError;
      }
      
      if (!userData?.auth_id) {
        throw new Error('Driver auth_id not found');
      }
      
      // Delete the user from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting driver from users table:', deleteError);
        throw deleteError;
      }
      
      // Also delete the auth user if possible
      // Note: This might require admin rights which might not be available in client-side
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userData.auth_id);
        if (authDeleteError) {
          console.warn('Could not delete auth user:', authDeleteError);
          // Continue anyway as the user record is already deleted
        }
      } catch (authDeleteException) {
        console.warn('Exception in auth user deletion (might be expected if not admin):', authDeleteException);
      }
      
      console.log('Driver deleted successfully');
      return true;
    } catch (error) {
      console.error(`Exception in deleteDriver:`, error);
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
      console.log('Resetting password for driver ID:', id);
      
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id, email')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching driver auth_id:', fetchError);
        throw fetchError;
      }
      
      if (!userData?.auth_id) {
        throw new Error('Driver auth_id not found');
      }
      
      // Generate a new password
      const newPassword = generatePassword(12);
      
      // Reset the password (this is typically an admin function and might not work client-side)
      try {
        // Try the admin API first
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userData.auth_id,
          { password: newPassword }
        );
        
        if (updateError) throw updateError;
      } catch (adminUpdateError) {
        console.warn('Admin password reset failed, trying password recovery:', adminUpdateError);
        
        // Fallback to password recovery email
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
          userData.email,
          {
            redirectTo: window.location.origin + '/reset-password'
          }
        );
        
        if (recoveryError) {
          console.error('Password recovery email failed:', recoveryError);
          throw recoveryError;
        }
        
        return { 
          success: true, 
          message: 'Password reset email sent to driver',
          isEmail: true 
        };
      }
      
      console.log('Password reset successfully');
      return { success: true, newPassword };
    } catch (error) {
      console.error(`Exception in resetPassword:`, error);
      throw error;
    }
  },

  /**
   * Get driver assignments
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array>} List of driver's assignments
   */
  getDriverAssignments: async (driverId) => {
    try {
      console.log(`Fetching assignments for driver ${driverId}`);
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicle:vehicle_id(id, plate_number, model, year)
        `)
        .eq('driver_id', driverId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching assignments for driver ${driverId}:`, error);
        throw error;
      }
      
      console.log(`Assignments fetched for driver ${driverId}:`, data?.length || 0);
      return data;
    } catch (error) {
      console.error(`Exception in getDriverAssignments:`, error);
      throw error;
    }
  },

  /**
   * Get driver documents
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array>} List of driver's documents
   */
  getDriverDocuments: async (driverId) => {
    try {
      console.log(`Fetching documents for driver ${driverId}`);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'driver')
        .eq('entity_id', driverId)
        .order('expiry_date');
      
      if (error) {
        console.error(`Error fetching documents for driver ${driverId}:`, error);
        throw error;
      }
      
      console.log(`Documents fetched for driver ${driverId}:`, data?.length || 0);
      
      // Process documents to add status
      return data.map(doc => {
        // Calculate status based on expiry date
        const today = new Date();
        const expiry = new Date(doc.expiry_date);
        const daysRemaining = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
        
        let status = 'valid';
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= 30) {
          status = 'expiring_soon';
        }
        
        return {
          ...doc,
          status,
          days_remaining: daysRemaining
        };
      });
    } catch (error) {
      console.error(`Exception in getDriverDocuments:`, error);
      throw error;
    }
  }
};

export default driverService;