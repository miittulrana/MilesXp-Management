import React, { createContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create context
export const ToastContext = createContext(null);

/**
 * Toast provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a toast notification
   * @param {Object} toast - Toast object
   */
  const addToast = useCallback((toast) => {
    setToasts((prevToasts) => [...prevToasts, toast]);
  }, []);

  /**
   * Remove a toast notification
   * @param {string} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Set up automatic toast removal based on duration
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) => {
      return setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  // Context value
  const contextValue = {
    toasts,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ToastProvider;