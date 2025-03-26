import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { ROUTES, STORAGE_KEYS, ROLES } from '../lib/constants';
import { useToast } from './useToast';

/**
 * Hook for authentication functionality
 * @returns {Object} Auth methods and state
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadInitialUser = async () => {
      try {
        // Check if there's a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          
          // Fetch user details from the users table
          const { data: userDetails, error: detailsError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (detailsError) throw detailsError;
          
          setUserDetails(userDetails);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadInitialUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // Fetch user details from the users table
        const { data: userDetails, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user details:', error);
        } else {
          setUserDetails(userDetails);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserDetails(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} remember - Remember user
   * @returns {Promise<Object>} Auth result
   */
  const login = async (email, password, remember = false) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Save remember me preference
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_USER, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
      }

      // Fetch user details
      const { data: userDetails, error: detailsError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (detailsError) throw detailsError;

      setUser(data.user);
      setUserDetails(userDetails);
      showToast('Login successful', 'success');
      
      // Redirect based on role
      if (userDetails.role === ROLES.ADMIN) {
        navigate(ROUTES.DASHBOARD);
      } else {
        navigate(ROUTES.VEHICLES);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Login failed', 'error');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserDetails(null);
      showToast('Logout successful', 'success');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
      showToast(error.message || 'Logout failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {Object} profileData - User profile data
   * @returns {Promise<Object>} Update result
   */
  const updateProfile = async (profileData) => {
    try {
      if (!user || !userDetails) {
        throw new Error('No authenticated user');
      }

      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userDetails.id)
        .select()
        .single();

      if (error) throw error;
      
      setUserDetails(data);
      showToast('Profile updated successfully', 'success');
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Update result
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      setLoading(true);
      
      // First verify the current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError) throw new Error('Current password is incorrect');

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      showToast('Password changed successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      showToast(error.message || 'Failed to change password', 'error');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset password (send reset email)
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset result
   */
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      showToast('Password reset email sent', 'success');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      showToast(error.message || 'Failed to send password reset email', 'error');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current user has admin privileges
   * @returns {boolean} Is admin
   */
  const isAdmin = () => {
    return userDetails?.role === ROLES.ADMIN;
  };

  /**
   * Get saved email from remember me
   * @returns {string|null} Remembered email or null
   */
  const getRememberedEmail = () => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_USER) || null;
  };

  return {
    user,
    userDetails,
    loading,
    initialized,
    login,
    logout,
    updateProfile,
    changePassword,
    resetPassword,
    isAdmin,
    getRememberedEmail
  };
};