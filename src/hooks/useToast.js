import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';
import { TOAST_TYPES, TOAST_DURATIONS } from '../lib/constants';

/**
 * Hook for using toast notifications functionality
 * @returns {Object} Toast methods and state
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { toasts, addToast, removeToast } = context;
  
  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  const showToast = (message, type = TOAST_TYPES.INFO, duration = TOAST_DURATIONS.MEDIUM) => {
    if (!message) return;
    
    // Validate toast type
    if (!Object.values(TOAST_TYPES).includes(type)) {
      type = TOAST_TYPES.INFO;
    }
    
    addToast({
      id: Date.now().toString(),
      message,
      type,
      duration
    });
  };
  
  /**
   * Show a success toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  const showSuccess = (message, duration = TOAST_DURATIONS.MEDIUM) => {
    showToast(message, TOAST_TYPES.SUCCESS, duration);
  };
  
  /**
   * Show an error toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  const showError = (message, duration = TOAST_DURATIONS.MEDIUM) => {
    showToast(message, TOAST_TYPES.ERROR, duration);
  };
  
  /**
   * Show a warning toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  const showWarning = (message, duration = TOAST_DURATIONS.MEDIUM) => {
    showToast(message, TOAST_TYPES.WARNING, duration);
  };
  
  /**
   * Show an info toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  const showInfo = (message, duration = TOAST_DURATIONS.MEDIUM) => {
    showToast(message, TOAST_TYPES.INFO, duration);
  };
  
  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  };
};