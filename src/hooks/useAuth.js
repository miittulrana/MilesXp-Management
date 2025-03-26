import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook for authentication functionality
 * Simply re-exports the auth context for use in components
 * @returns {Object} Auth methods and state
 */
export const useAuth = () => {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return authContext;
};

export default useAuth;