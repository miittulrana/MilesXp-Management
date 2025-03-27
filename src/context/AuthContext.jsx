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
          
          // If we can't find the user in the database, create a default one
          // This is helpful for initial setup or when auth exists but user record doesn't
          const defaultUserDetails = {
            id: userId,
            auth_id: userId,
            name: 'Default User',
            email: user?.email || 'user@example.com',
            role: ROLES.ADMIN
          };
          
          return defaultUserDetails;
        }
        
        return data;
      } catch (err) {
        console.error('Exception fetching user details:', err);
        return null;
      }
    };

    // Get current session with timeout
    const setupAuth = async () => {
      try {
        console.log('Setting up auth with timeout protection...');
        setLoading(true);
        
        // Set a timeout to prevent hanging indefinitely
        const timeoutId = setTimeout(() => {
          console.warn('Auth initialization timed out');
          // If we timeout, just move forward with no user
          setUser(null);
          setUserDetails(null);
          setInitialized(true);
          setLoading(false);
        }, 5000); // 5 second timeout
        
        try {
          const { data, error } = await supabase.auth.getSession();
          
          // Clear the timeout since we got a response
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('Session check error:', error);
            setAuthError(error);
            setInitialized(true);
            setLoading(false);
            return;
          }
          
          const session = data?.session;
          console.log('Initial session check:', session ? 'Session found' : 'No session');
          
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
                auth_id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User',
                email: session.user.email,
                role: ROLES.ADMIN // Default to admin role for now to help debugging
              });
            }
          }
          
          // Always set initialized to true after initial check
          setInitialized(true);
          setLoading(false);
        } catch (innerError) {
          // Clear the timeout
          clearTimeout(timeoutId);
          
          console.error('Error in auth setup:', innerError);
          // Move forward with initialization even on error
          setInitialized(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Setup auth error:', err);
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
            auth_id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            role: ROLES.ADMIN // Default to admin role for testing
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
      
      // Use the actual Supabase auth instead of mock
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        setAuthError(error);
        setLoading(false);
        return { success: false, error };
      }
      
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_USER, email);
      }
      
      // Note: The user state will be set by the auth listener
      // No need to manually set user and userDetails here
      
      setLoading(false);
      return { success: true, userRole: data?.user?.role || ROLES.ADMIN };
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error);
      setLoading(false);
      return { success: false, error };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        setLoading(false);
        return { success: false, error };
      }
      
      // The onAuthStateChange listener will handle clearing user state
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

  // Get remembered email
  const getRememberedEmail = () => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_USER) || '';
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!user) return { success: false, error: 'No user logged in' };
      
      // Update the user's profile in the database
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('auth_id', user.id)
        .select();
      
      if (error) {
        console.error("Update profile error:", error);
        return { success: false, error };
      }
      
      // Update local state
      setUserDetails(prev => ({
        ...prev,
        ...profileData
      }));
      
      return { success: true, data: data[0] || { ...userDetails, ...profileData } };
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