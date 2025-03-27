import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import supabase from '../lib/supabase';
import { ROLES, STORAGE_KEYS } from '../lib/constants';

// Create context
export const AuthContext = createContext(null);

/**
 * Authentication provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check for existing session and set up auth listener
  useEffect(() => {
    console.log('AuthProvider initializing...');
    
    // Function to fetch user details from the database
    const fetchUserDetails = async (userId) => {
      try {
        console.log('Fetching user details for ID:', userId);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching user details:', error);
          return null;
        }
        
        if (!data) {
          console.warn('No user found in the database for auth_id:', userId);
          return null;
        }
        
        console.log('User details retrieved:', data);
        return data;
      } catch (err) {
        console.error('Exception fetching user details:', err);
        return null;
      }
    };

    // Get current session
    const setupAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Initial session check:', session ? 'Session found' : 'No session');
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setUser(session.user);
          
          // Fetch user details from database
          const details = await fetchUserDetails(session.user.id);
          
          if (details) {
            setUserDetails(details);
          } else {
            // Fallback to basic details if database fetch fails
            setUserDetails({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              role: ROLES.DRIVER // Default to driver role
            });
          }
        }
        
        // Always set initialized to true after initial check,
        // even if there is no session
        setInitialized(true);
        setLoading(false);
      } catch (err) {
        console.error('Setup auth error:', err);
        setAuthError(err);
        // Still set initialized to true even on error
        setInitialized(true);
        setLoading(false);
      }
    };

    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.id);
        setUser(session.user);
        
        // Fetch user details from database
        const details = await fetchUserDetails(session.user.id);
        
        if (details) {
          setUserDetails(details);
        } else {
          // Fallback to basic details if database fetch fails
          setUserDetails({
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            role: ROLES.DRIVER // Default to driver role
          });
        }
        
        setLoading(false);
        // Ensure initialized is set to true
        setInitialized(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setUserDetails(null);
        setLoading(false);
        
        // Clear remembered email upon logout
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });

    // Initialize auth
    setupAuth();

    // Cleanup function
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Login function
  const login = async (email, password, remember = false) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setAuthError(error);
        setLoading(false);
        return { success: false, error };
      }

      console.log('Login successful:', data.user.id);
      setUser(data.user);
      
      // Remember email if requested
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_USER, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
      }
      
      // Fetch user details from database
      const details = await fetchUserDetails(data.user.id);
      
      if (details) {
        setUserDetails(details);
      } else {
        // Fallback to basic details if database fetch fails
        setUserDetails({
          id: data.user.id,
          name: data.user.email?.split('@')[0] || 'User',
          email: data.user.email,
          role: ROLES.DRIVER // Default to driver role
        });
      }
      
      setLoading(false);
      return { success: true, userRole: details?.role || ROLES.DRIVER };
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error);
      setLoading(false);
      return { success: false, error };
    }
  };

  // Function to fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  // Get remembered email
  const getRememberedEmail = () => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_USER) || '';
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserDetails(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
      return { success: false, error };
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userDetails?.role === ROLES.ADMIN;
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!user) return { success: false, error: 'No user logged in' };
      
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('auth_id', user.id)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setUserDetails(prev => ({
        ...prev,
        ...profileData
      }));
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error };
    }
  };

  // Context value
  const contextValue = {
    user,
    userDetails,
    loading,
    initialized,
    authError,
    login,
    logout,
    isAdmin,
    updateProfile,
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