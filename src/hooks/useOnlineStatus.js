import { useState, useEffect } from 'react';

/**
 * Hook for tracking online/offline status
 * @returns {Object} Online status and methods
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(
    isOnline ? new Date() : null
  );

  useEffect(() => {
    // Function to update online status
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online) {
        setLastOnlineTime(new Date());
        setHasNetworkError(false);
      }
    };

    // Register event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Network error detection
    const handleNetworkError = () => {
      setHasNetworkError(true);
    };

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('error', handleNetworkError, true);
    };
  }, []);

  /**
   * Check if network request should be attempted
   * @returns {boolean} Can attempt request
   */
  const canAttemptRequest = () => {
    return isOnline && !hasNetworkError;
  };

  /**
   * Get time since last online
   * @returns {number|null} Seconds since last online or null if never online
   */
  const timeSinceLastOnline = () => {
    if (!lastOnlineTime) return null;
    return Math.floor((new Date() - lastOnlineTime) / 1000);
  };

  /**
   * Reset network error state
   */
  const resetNetworkError = () => {
    setHasNetworkError(false);
  };

  return {
    isOnline,
    hasNetworkError,
    lastOnlineTime,
    canAttemptRequest,
    timeSinceLastOnline,
    resetNetworkError
  };
};