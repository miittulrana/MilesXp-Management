import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import supabase from '../lib/supabase';
import { ROLES } from '../lib/constants';

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
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(true); // Start as initialized

  // Simplified authentication
  useEffect(() => {
    // Check if we have a session
    const checkSession = async () => {
      try {
        // Get current session
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // We have a user
          setUser(data.session.user);
          
          // Set basic user details - for any case
          setUserDetails({
            id: Date.now().toString(),
            name: data.session.user.email?.split('@')[0] || 'User',
            email: data.session.user.email,
            role: ROLES.DRIVER // Default to driver role
          });
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setInitialized(true);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        
        // Set basic user details
        setUserDetails({
          id: Date.now().toString(),
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: ROLES.DRIVER // Default to driver role
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserDetails(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      
      // Set basic user details
      setUserDetails({
        id: Date.now().toString(),
        name: data.user.email?.split('@')[0] || 'User',
        email: data.user.email,
        role: ROLES.DRIVER // Default to driver role
      });
      
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserDetails(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userDetails?.role === ROLES.ADMIN;
  };

  // Context value
  const contextValue = {
    user,
    userDetails,
    loading,
    initialized,
    login,
    logout,
    isAdmin,
    updateProfile: () => Promise.resolve({ success: true }), // Stub
    getRememberedEmail: () => null // Stub
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