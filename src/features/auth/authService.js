import supabase from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

/**
 * Authentication service adapter that uses the main auth context
 * This provides compatibility for existing components that use this service
 */
const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  login: async (email, password) => {
    try {
      // This would normally use the useAuth hook, but since hooks can't be used inside
      // normal functions, we'll use supabase directly to maintain compatibility
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Logout current user
   * @returns {Promise<Object>} Logout result
   */
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  getUserProfile: async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: async (profileData) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          phone: profileData.phone
        })
        .eq('auth_id', authData.user.id)
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

export default authService;