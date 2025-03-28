import supabase from '../../lib/supabase';
import { ROLES } from '../../lib/constants';
import { generatePassword } from '../../lib/utils';

/**
 * Service for user management operations
 */
const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} List of users
   */
  getUsers: async () => {
    try {
      console.log('Fetching all users...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('role', { ascending: false }) // Admins first
        .order('name');
      
      if (error) {
        console.error('Error fetching users:', error);
        throw new Error(error.message || 'Failed to fetch users');
      }
      
      console.log('Users fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Exception in getUsers:', error);
      throw error;
    }
  },

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} List of users with specified role
   */
  getUsersByRole: async (role) => {
    try {
      console.log(`Fetching users with role: ${role}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('name');
      
      if (error) {
        console.error(`Error fetching users with role ${role}:`, error);
        throw new Error(error.message || `Failed to fetch users with role ${role}`);
      }
      
      console.log(`Users with role ${role} fetched:`, data?.length || 0);
      return data || [];
    } catch (error) {
      console.error(`Exception in getUsersByRole:`, error);
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User details
   */
  getUserById: async (id) => {
    try {
      console.log('Fetching user details for ID:', id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user details:', error);
        throw new Error(error.message || 'User not found');
      }
      
      console.log('User details fetched:', data?.id);
      return data;
    } catch (error) {
      console.error(`Exception in getUserById:`, error);
      throw error;
    }
  },

  /**
   * Add a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user with password
   */
  addUser: async (userData) => {
    try {
      console.log('Adding new user - Request received:', userData);
      
      // Ensure required fields
      if (!userData.name || !userData.email) {
        throw new Error('Name and email are required');
      }
      
      // Validate the role
      if (!Object.values(ROLES).includes(userData.role)) {
        throw new Error(`Invalid role: ${userData.role}`);
      }
      
      // Generate a secure password
      const password = userData.password || generatePassword(12);
      console.log('Generated password (only logged for debugging)');
      
      // Create auth user first
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(authError.message || 'Failed to create user account');
      }
      
      if (!authData?.user) {
        console.error('Auth user creation failed - no user returned');
        throw new Error('Auth user creation failed - no user returned');
      }
      
      console.log('Auth user created successfully, ID:', authData.user.id);
      
      // Create user record in our database
      console.log('Creating user record in database...');
      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          role: userData.role
        })
        .select();
      
      if (error) {
        console.error('Error creating user record:', error);
        
        // Attempt to clean up auth user if user table insert fails
        console.log('Attempting to clean up auth user after database insertion failure');
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('Auth user cleanup successful');
        } catch (cleanupError) {
          console.error('Error cleaning up auth user:', cleanupError);
        }
        
        throw new Error(error.message || 'Failed to create user record');
      }
      
      console.log('User record created successfully, ID:', data[0]?.id);
      
      // Return the created user with the generated password for displaying to admin
      return { ...data[0], password };
    } catch (error) {
      console.error('Exception in addUser:', error);
      throw error;
    }
  },

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user
   */
  updateUser: async (id, userData) => {
    try {
      console.log('Updating user ID:', id, userData);
      
      // Create update object with only provided fields
      const updateData = {};
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.role !== undefined) {
        // Validate the role
        if (!Object.values(ROLES).includes(userData.role)) {
          throw new Error(`Invalid role: ${userData.role}`);
        }
        updateData.role = userData.role;
      }
      
      // Update the user record
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating user:', error);
        throw new Error(error.message || 'Failed to update user');
      }
      
      console.log('User updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in updateUser:`, error);
      throw error;
    }
  },

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success flag
   */
  deleteUser: async (id) => {
    try {
      console.log('Deleting user ID:', id);
      
      // First get the auth_id and check that user exists
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id, role')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching user auth_id:', fetchError);
        throw new Error(fetchError.message || 'User not found');
      }
      
      if (!userData?.auth_id) {
        throw new Error('User auth_id not found');
      }
      
      // Check for related records if this is a driver
      if (userData.role === ROLES.DRIVER) {
        // Check if driver has assigned vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, plate_number')
          .eq('assigned_to', id)
          .limit(1);
          
        if (!vehiclesError && vehicles && vehicles.length > 0) {
          throw new Error(`Cannot delete driver with assigned vehicle: ${vehicles[0].plate_number}. Please unassign all vehicles first.`);
        }
      }
      
      // Delete the user from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting user from users table:', deleteError);
        throw new Error(deleteError.message || 'Failed to delete user record');
      }
      
      // Try to delete the auth user (might need admin rights)
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userData.auth_id);
        if (authDeleteError) {
          console.warn('Could not delete auth user:', authDeleteError);
          // Continue anyway as the user record is already deleted
        }
      } catch (authDeleteException) {
        console.warn('Exception in auth user deletion (might be expected if not admin):', authDeleteException);
      }
      
      console.log('User deleted successfully');
      return true;
    } catch (error) {
      console.error(`Exception in deleteUser:`, error);
      throw error;
    }
  },

  /**
   * Reset user's password
   * @param {string} id - User ID
   * @returns {Promise<Object>} Result with new password
   */
  resetPassword: async (id) => {
    try {
      console.log('Resetting password for user ID:', id);
      
      // First get the auth_id and email
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id, email, name')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching user auth_id:', fetchError);
        throw new Error(fetchError.message || 'User not found');
      }
      
      if (!userData?.auth_id) {
        throw new Error('User auth_id not found');
      }
      
      // Generate a new secure password
      const newPassword = generatePassword(12);
      
      // Try to update the password directly
      try {
        // Try using admin API to set the password directly
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userData.auth_id,
          { password: newPassword }
        );
        
        if (updateError) {
          throw updateError;
        }
        
        console.log('Password reset successfully');
        return { 
          success: true, 
          newPassword, 
          userName: userData.name 
        };
      } catch (adminUpdateError) {
        console.warn('Admin password reset failed, trying password recovery email:', adminUpdateError);
        
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
          message: 'Password reset email sent to user',
          isEmail: true,
          userName: userData.name 
        };
      }
    } catch (error) {
      console.error(`Exception in resetPassword:`, error);
      throw error;
    }
  }
};

export default userService;