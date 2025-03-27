import supabase from '../../lib/supabase';
import { ROLES } from '../../lib/constants';
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
        .eq('role', ROLES.DRIVER)
        .order('name');
      
      if (error) {
        console.error('Error fetching drivers:', error);
        throw new Error(error.message || 'Failed to fetch drivers');
      }
      
      console.log('Drivers fetched:', data?.length || 0);
      
      // Format data for UI
      return data.map(driver => ({
        ...driver,
        assigned_vehicle: driver.vehicles && driver.vehicles.length > 0 
          ? driver.vehicles[0].plate_number 
          : null,
        assigned_vehicle_id: driver.vehicles && driver.vehicles.length > 0 
          ? driver.vehicles[0].id 
          : null
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
        .eq('role', ROLES.DRIVER)
        .single();
      
      if (error) {
        console.error('Error fetching driver details:', error);
        throw new Error(error.message || 'Driver not found');
      }
      
      console.log('Driver details fetched:', data?.id);
      
      // Format data for UI
      return {
        ...data,
        assigned_vehicle: data.vehicles && data.vehicles.length > 0 
          ? data.vehicles[0].plate_number 
          : null,
        assigned_vehicle_id: data.vehicles && data.vehicles.length > 0 
          ? data.vehicles[0].id 
          : null
      };
    } catch (error) {
      console.error(`Exception in getDriverById:`, error);
      throw error;
    }
  },

  /**
   * Add a new driver
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} Created driver with password
   */
  addDriver: async (driverData) => {
    try {
      console.log('Adding new driver:', driverData);
      
      // Generate a password
      const password = driverData.password || generatePassword(10);
      
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: driverData.email,
        password: password,
        options: {
          data: {
            name: driverData.name,
            role: ROLES.DRIVER
          }
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(authError.message || 'Failed to create user authentication');
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
          role: ROLES.DRIVER
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
        
        throw new Error(error.message || 'Failed to create driver record');
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
        .eq('role', ROLES.DRIVER)
        .select();
      
      if (error) {
        console.error('Error updating driver:', error);
        throw new Error(error.message || 'Failed to update driver');
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
      
      // First check if driver has any vehicles assigned
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('assigned_to', id);
      
      if (!vehicleError && vehicleData?.length > 0) {
        throw new Error('Cannot delete driver with assigned vehicles. Please unassign vehicles first.');
      }
      
      // Get auth_id for later cleanup
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .eq('role', ROLES.DRIVER)
        .single();
      
      if (fetchError) {
        console.error('Error fetching driver auth_id:', fetchError);
        throw new Error(fetchError.message || 'Driver not found');
      }
      
      // Delete the user from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('role', ROLES.DRIVER);
      
      if (deleteError) {
        console.error('Error deleting driver:', deleteError);
        throw new Error(deleteError.message || 'Failed to delete driver');
      }
      
      // Try to clean up auth user
      if (userData?.auth_id) {
        try {
          await supabase.auth.admin.deleteUser(userData.auth_id);
        } catch (authDeleteException) {
          console.warn('Exception in auth user deletion:', authDeleteException);
          // Continue anyway as the user record is already deleted
        }
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
        .eq('role', ROLES.DRIVER)
        .single();
      
      if (fetchError) {
        console.error('Error fetching driver auth_id:', fetchError);
        throw new Error(fetchError.message || 'Driver not found');
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
        
        console.log('Password reset successfully');
        return { success: true, newPassword };
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
          throw new Error(recoveryError.message || 'Failed to reset password');
        }
        
        return { 
          success: true, 
          message: 'Password reset email sent to driver',
          isEmail: true 
        };
      }
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
          vehicle:vehicle_id(id, plate_number, model, year, status)
        `)
        .eq('driver_id', driverId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error(`Error fetching assignments for driver ${driverId}:`, error);
        throw new Error(error.message || 'Failed to fetch driver assignments');
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
        throw new Error(error.message || 'Failed to fetch driver documents');
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
  },

  /**
   * Get available drivers (not assigned to any vehicle)
   * @returns {Promise<Array>} List of available drivers
   */
  getAvailableDrivers: async () => {
    try {
      console.log('Fetching available drivers');
      
      // Get all drivers
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone
        `)
        .eq('role', ROLES.DRIVER)
        .order('name');
      
      if (error) {
        console.error('Error fetching available drivers:', error);
        throw new Error(error.message || 'Failed to fetch available drivers');
      }
      
      // Now get all assigned drivers
      const { data: assignedDrivers, error: assignedError } = await supabase
        .from('vehicles')
        .select('assigned_to')
        .not('assigned_to', 'is', null);
      
      if (!assignedError) {
        // Filter out assigned drivers
        const assignedIds = assignedDrivers.map(v => v.assigned_to);
        const availableDrivers = data.filter(driver => !assignedIds.includes(driver.id));
        
        console.log('Available drivers fetched:', availableDrivers?.length || 0);
        return availableDrivers;
      }
      
      // If there was an error getting assigned drivers, just return all drivers
      console.log('All drivers fetched (could not filter):', data?.length || 0);
      return data;
    } catch (error) {
      console.error('Exception in getAvailableDrivers:', error);
      throw error;
    }
  }
};

export default driverService;