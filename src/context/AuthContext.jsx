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

  // Debug function to check user state
  const logUserState = () => {
    console.log("[AUTH] Current State:", { 
      user: user ? `User ${user.id} (${user.email})` : "No user", 
      userDetails: userDetails ? `Details for ${userDetails.name}` : "No details",
      loading, 
      initialized 
    });
  };

  // Load initial auth state
  useEffect(() => {
    const loadInitialUser = async () => {
      try {
        console.log("[AUTH] Loading initial user");
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[AUTH] Session error:", sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log("[AUTH] Found existing session for:", session.user.email);
          // Set user immediately - this allows routing to proceed
          setUser(session.user);
          
          try {
            // Fetch user details from the users table
            const { data: userDetails, error: detailsError } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', session.user.id)
              .single();

            if (detailsError) {
              console.error("[AUTH] Error fetching user details:", detailsError);
              // Don't throw here - we still have a valid auth user
            } else if (userDetails) {
              console.log("[AUTH] Retrieved user details:", userDetails.name);
              setUserDetails(userDetails);
            }
          } catch (detailsError) {
            console.error("[AUTH] Error in user details flow:", detailsError);
            // Continue without user details
          }
        } else {
          console.log("[AUTH] No active session found");
        }
      } catch (error) {
        console.error("[AUTH] Error loading user:", error);
      } finally {
        // Always set loading to false and initialized to true
        setLoading(false);
        setInitialized(true);
        console.log("[AUTH] Initial loading complete, initialized:", true);
      }
    };

    loadInitialUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH] Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("[AUTH] User signed in:", session.user.email);
        
        // Set user immediately
        setUser(session.user);
        
        try {
          // Fetch user details from the users table
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (error) {
            console.error("[AUTH] Error fetching user details on auth change:", error);
          } else if (data) {
            console.log("[AUTH] User details retrieved:", data.name);
            setUserDetails(data);
          }
        } catch (error) {
          console.error("[AUTH] Error in auth change flow:", error);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("[AUTH] User signed out");
        setUser(null);
        setUserDetails(null);
        setLoading(false);
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
    console.log("[AUTH] Login attempt for:", email);
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AUTH] Login error:", error);
        setLoading(false);
        return { success: false, error };
      }

      console.log("[AUTH] Login successful for:", email);

      // Save remember me preference
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_USER, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
      }

      // Set user immediately
      setUser(data.user);
      
      try {
        // Get user details
        const { data: details, error: detailsError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();
          
        if (detailsError) {
          console.error("[AUTH] Error fetching user details after login:", detailsError);
        } else if (details) {
          setUserDetails(details);
          console.log("[AUTH] User details loaded:", details.name);
          return { success: true, role: details.role };
        }
      } catch (detailsError) {
        console.error("[AUTH] Error getting user details:", detailsError);
      }
      
      // Still return success even if we couldn't get details
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("[AUTH] Error during login:", error);
      setLoading(false);
      return { success: false, error };
    }
  }, []);

  /**
   * Sign out the current user
   * @returns {Promise<Object>} Logout result
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[AUTH] Logging out user");
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserDetails(null);
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
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

  // Debug output
  useEffect(() => {
    logUserState();
  }, [user, userDetails, loading, initialized]);

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