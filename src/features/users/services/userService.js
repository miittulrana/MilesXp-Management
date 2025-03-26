import supabase from '../../../lib/supabase';
import { generatePassword } from '../../../lib/utils';

/**
 * Service for user-related operations
 */
const userService = {
  /**
   * Get all users
   * @returns {Promise<Object>} Result object with data or error
   */
  async getUsers() {
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { error };
    }
  },
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object with data or error
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { error };
    }
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Result object with data or error
   */
  async createUser(userData) {
    try {
      const { email, name, phone, role } = userData;
      
      // Generate random password
      const password = generatePassword(12);
      const adminId = (await supabase.auth.getUser()).data.user.id;
      
      const { data, error } = await supabase.rpc('create_user', {
        user_email: email,
        user_password: password,
        user_name: name,
        user_phone: phone,
        user_role: role,
        admin_id: adminId
      });
      
      if (error) throw error;
      
      return { data, password };
    } catch (error) {
      console.error('Error creating user:', error);
      return { error };
    }
  },
  
  /**
   * Update an existing user
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Result object with data or error
   */
  async updateUser(userId, userData) {
    try {
      const { name, phone, role } = userData;
      const adminId = (await supabase.auth.getUser()).data.user.id;
      
      const { data, error } = await supabase.rpc('update_user', {
        user_id: userId,
        user_name: name,
        user_phone: phone,
        user_role: role,
        admin_id: adminId
      });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { error };
    }
  },
  
  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object with success status or error
   */
  async deleteUser(userId) {
    try {
      const adminId = (await supabase.auth.getUser()).data.user.id;
      
      const { data, error } = await supabase.rpc('delete_user', {
        user_id: userId,
        admin_id: adminId
      });
      
      if (error) throw error;
      
      return { success: data };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error };
    }
  },
  
  /**
   * Reset user password
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object with new password or error
   */
  async resetPassword(userId) {
    try {
      // Generate new random password
      const newPassword = generatePassword(12);
      const adminId = (await supabase.auth.getUser()).data.user.id;
      
      const { data, error } = await supabase.rpc('reset_user_password', {
        user_id: userId,
        new_password: newPassword,
        admin_id: adminId
      });
      
      if (error) throw error;
      
      return { success: data, newPassword };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  },
  
  /**
   * Get users with driver role
   * @returns {Promise<Object>} Result object with data or error
   */
  async getDrivers() {
    try {
      const { data, error } = await supabase.rpc('get_all_drivers_summary');
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return { error };
    }
  },
  
  /**
   * Search users by query string
   * @param {string} query - Search query
   * @returns {Promise<Object>} Result object with data or error
   */
  async searchUsers(query) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Error searching users:', error);
      return { error };
    }
  }
};

export default userService;