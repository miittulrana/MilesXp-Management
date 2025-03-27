// src/features/auth/authService.js
import supabase from '../../lib/supabase';

const authService = {
  login: async (email, password) => {
    try {
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