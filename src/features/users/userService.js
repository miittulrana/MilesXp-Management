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
        .order('role', { ascending: false })
        .order('name');
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Users fetched:', data?.length || 0);
      return data;
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
        throw error;
      }
      
      console.log(`Users with role ${role} fetched:`, data?.length || 0);
      return data;
    } catch (error) {
      console.error(`Exception in getUsersByRole:`, error);
      throw error;
    }
  },

  /**
   * Get admin users
   * @returns {Promise<Array>} List of admin users
   */
  getAdmins: async () => {
    try {
      return await userService.getUsersByRole(ROLES.ADMIN);
    } catch (error) {
      console.error('Exception in getAdmins:', error);
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
        throw error;
      }
      
      console.log('User details fetched:', data?.id);
      return data;
    } catch (error) {
      console.error(`Exception in getUserById:`, error);
      throw error;
    }
  },

  /**
   * Get user by auth ID
   * @param {string} authId - Auth ID
   * @returns {Promise<Object>} User details
   */
  getUserByAuthId: async (authId) => {
    try {
      console.log('Fetching user details for auth ID:', authId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();
      
      if (error) {
        console.error('Error fetching user details by auth ID:', error);
        throw error;
      }
      
      console.log('User details fetched by auth ID:', data?.id);
      return data;
    } catch (error) {
      console.error(`Exception in getUserByAuthId:`, error);
      throw error;
    }
  },

  /**
   * Add a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  addUser: async (userData) => {
    try {
      console.log('Adding new user:', userData);
      
      // Validate the role
      if (!Object.values(ROLES).includes(userData.role)) {
        throw new Error(`Invalid role: ${userData.role}`);
      }
      
      // Generate a password if none is provided
      const password = userData.password || generatePassword(10);
      
      // Create auth user first
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
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          role: userData.role
        })
        .select();
      
      if (error) {
        console.error('Error creating user record:', error);
        
        // Clean up auth user if user table insert fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Error cleaning up auth user:', cleanupError);
        }
        
        throw error;
      }
      
      console.log('User record created:', data[0]?.id);
      
      // Return the created user with the generated password
      return { ...data[0], password };
    } catch (error) {
      console.error('Exception in addUser:', error);
      throw error;
    }
  },

  /**
   * Add a new admin user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created admin user
   */
  addAdmin: async (userData) => {
    try {
      return await userService.addUser({
        ...userData,
        role: ROLES.ADMIN
      });
    } catch (error) {
      console.error('Exception in addAdmin:', error);
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
      
      // Prepare update data
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
        throw error;
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
      
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching user auth_id:', fetchError);
        throw fetchError;
      }
      
      if (!userData?.auth_id) {
        throw new Error('User auth_id not found');
      }
      
      // Delete the user from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting user from users table:', deleteError);
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
      
      // First get the auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id, email')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching user auth_id:', fetchError);
        throw fetchError;
      }
      
      if (!userData?.auth_id) {
        throw new Error('User auth_id not found');
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
          message: 'Password reset email sent to user',
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
   * Change user role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Updated user
   */
  changeUserRole: async (id, role) => {
    try {
      console.log(`Changing role for user ${id} to ${role}`);
      
      // Validate the role
      if (!Object.values(ROLES).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      // Update the user record
      const { data, error } = await supabase
        .from('users')
        .update({
          role
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error changing user role:', error);
        throw error;
      }
      
      console.log('User role updated successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error(`Exception in changeUserRole:`, error);
      throw error;
    }
  },

  /**
   * Get user's activity
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User activity statistics
   */
  getUserActivity: async (userId) => {
    try {
      console.log(`Fetching activity for user ${userId}`);
      
      // Get user details first
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user details:', userError);
        throw userError;
      }
      
      const activity = {
        user_id: userId,
        role: user.role,
        assignments: [],
        blocks: [],
        documents: [],
        last_login: null
      };
      
      // For admin users, get blocks and assignments they've created
      if (user.role === ROLES.ADMIN) {
        // Get assignments created by this admin
        const { data: assignments, error: assignmentsError } = await supabase
          .from('vehicle_assignments')
          .select(`
            id,
            vehicle_id,
            driver_id,
            start_date,
            end_date,
            status
          `)
          .eq('assigned_by', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!assignmentsError) {
          activity.assignments = assignments || [];
        }
        
        // Get blocks created by this admin
        const { data: blocks, error: blocksError } = await supabase
          .from('vehicle_blocks')
          .select(`
            id,
            vehicle_id,
            start_date,
            end_date,
            reason,
            status
          `)
          .eq('blocked_by', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!blocksError) {
          activity.blocks = blocks || [];
        }
      }
      
      // For driver users, get their assignments
      if (user.role === ROLES.DRIVER) {
        // Get assignments for this driver
        const { data: assignments, error: assignmentsError } = await supabase
          .from('vehicle_assignments')
          .select(`
            id,
            vehicle_id,
            start_date,
            end_date,
            status
          `)
          .eq('driver_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!assignmentsError) {
          activity.assignments = assignments || [];
        }
      }
      
      // Get documents for this user
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', user.role === ROLES.DRIVER ? 'driver' : 'admin')
        .eq('entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!documentsError) {
        activity.documents = documents || [];
      }
      
      return activity;
    } catch (error) {
      console.error(`Exception in getUserActivity:`, error);
      throw error;
    }
  }
};

export default userService;