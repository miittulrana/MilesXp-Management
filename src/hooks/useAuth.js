import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook for authentication functionality
 * Simply re-exports the auth context for use in components
 * @returns {Object} Auth methods and state
 */
export const useAuth = () => {
  try {
    const authContext = useContext(AuthContext);
    
    if (!authContext) {
      console.error('useAuth was called outside of AuthProvider! Authentication will not work properly.');
      return {
        user: null,
        userDetails: null,
        loading: false,
        initialized: true,
        login: () => Promise.resolve({ success: false, error: 'No auth context available' }),
        logout: () => Promise.resolve({ success: false, error: 'No auth context available' }),
        updateProfile: () => Promise.resolve({ success: false, error: 'No auth context available' }),
        isAdmin: () => false,
        getRememberedEmail: () => null
      };
    }
    
    return authContext;
  } catch (error) {
    console.error('Error in useAuth hook:', error);
    return {
      user: null,
      userDetails: null,
      loading: false,
      initialized: true,
      login: () => Promise.resolve({ success: false, error: 'Error in auth hook' }),
      logout: () => Promise.resolve({ success: false, error: 'Error in auth hook' }),
      updateProfile: () => Promise.resolve({ success: false, error: 'Error in auth hook' }),
      isAdmin: () => false,
      getRememberedEmail: () => null
    };
  }
};

export default useAuth;