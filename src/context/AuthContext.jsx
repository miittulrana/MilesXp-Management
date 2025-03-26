import React, { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import supabase from '../lib/supabase';
import { ROLES, STORAGE_KEYS } from '../lib/constants';

// Create context
export const AuthContext = createContext(null);

/**
 * Authentication provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load initial auth state
  useEffect(() => {
    const loadInitialUser = async () => {
      try {
        // Get current session
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

    // Cleanup
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
  const login = useCallback(async (email, password, remember = false) => {
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

      return { success: true, role: userDetails.role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign out the current user
   * @returns {Promise<Object>} Logout result
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserDetails(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param {Object} profileData - User profile data
   * @returns {Promise<Object>} Update result
   */
  const updateProfile = useCallback(async (profileData) => {
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
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [user, userDetails]);

  /**
   * Check if current user has admin privileges
   * @returns {boolean} Is admin
   */
  const isAdmin = useCallback(() => {
    return userDetails?.role === ROLES.ADMIN;
  }, [userDetails]);

  /**
   * Get remembered email
   * @returns {string|null} Remembered email
   */
  const getRememberedEmail = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_USER) || null;
  }, []);

  // Context value
  const contextValue = {
    user,
    userDetails,
    loading,
    initialized,
    login,
    logout,
    updateProfile,
    isAdmin,
    getRememberedEmail
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider;