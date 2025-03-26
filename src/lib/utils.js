import dayjs from 'dayjs';
import { DATE_FORMATS, DOCUMENT_STATUS, SERVICE_STATUS, SERVICE_CONSTANTS } from './constants';

/**
 * Format a date using dayjs
 * @param {string|Date} date - The date to format
 * @param {string} format - The format string (from DATE_FORMATS)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  return dayjs(date).format(format);
};

/**
 * Calculate days remaining until a date
 * @param {string|Date} date - The target date
 * @returns {number} Number of days remaining (negative if date has passed)
 */
export const getDaysRemaining = (date) => {
  if (!date) return 0;
  const now = dayjs();
  const target = dayjs(date);
  return target.diff(now, 'day');
};

/**
 * Get document status based on expiry date
 * @param {string|Date} expiryDate - The document expiry date
 * @returns {string} Document status
 */
export const getDocumentStatus = (expiryDate) => {
  const daysRemaining = getDaysRemaining(expiryDate);
  
  if (daysRemaining < 0) {
    return DOCUMENT_STATUS.EXPIRED;
  } else if (daysRemaining <= 30) {
    return DOCUMENT_STATUS.EXPIRING_SOON;
  } else {
    return DOCUMENT_STATUS.VALID;
  }
};

/**
 * Get service status based on current and next service km
 * @param {number} currentKm - Current kilometers of vehicle
 * @param {number} nextServiceKm - Next service due at kilometers
 * @returns {string} Service status
 */
export const getServiceStatus = (currentKm, nextServiceKm) => {
  const kmRemaining = nextServiceKm - currentKm;
  
  if (kmRemaining < 0) {
    return SERVICE_STATUS.OVERDUE;
  } else if (kmRemaining <= SERVICE_CONSTANTS.SERVICE_WARNING_KM) {
    return SERVICE_STATUS.DUE_SOON;
  } else {
    return SERVICE_STATUS.COMPLETED;
  }
};

/**
 * Calculate next service km based on current km
 * @param {number} currentKm - Current kilometers of vehicle
 * @returns {number} Next service due at kilometers
 */
export const calculateNextServiceKm = (currentKm) => {
  return currentKm + SERVICE_CONSTANTS.NEXT_SERVICE_KM;
};

/**
 * Format a phone number to standard format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digitsOnly.length === 10) {
    return digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (digitsOnly.length > 10) {
    return `+${digitsOnly.slice(0, -10)} ${digitsOnly.slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}`;
  }
  
  return phone;
};

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Generate random password with required complexity
 * @param {number} length - Length of password
 * @returns {string} Generated password
 */
export const generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*_-+=';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each character type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 20) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create downloadable CSV from data
 * @param {Array} data - Array of objects to convert to CSV
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (data, filename) => {
  if (!data || !data.length) return;
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => headers.map(header => {
      const cellData = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // Handle special characters and commas in the data
      if (typeof cellData === 'string' && (cellData.includes(',') || cellData.includes('"') || cellData.includes('\n'))) {
        return `"${cellData.replace(/"/g, '""')}"`;
      }
      return cellData;
    }).join(','))
  ];
  
  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get status badge class based on status
 * @param {string} status - Status value
 * @param {string} type - Type of status (document, service, vehicle)
 * @returns {string} CSS class for badge
 */
export const getStatusBadgeClass = (status, type) => {
  if (!status) return '';
  
  switch (type) {
    case 'document':
      switch (status.toLowerCase()) {
        case DOCUMENT_STATUS.VALID.toLowerCase(): return 'badge badge-valid';
        case DOCUMENT_STATUS.EXPIRING_SOON.toLowerCase(): return 'badge badge-expiring';
        case DOCUMENT_STATUS.EXPIRED.toLowerCase(): return 'badge badge-expired';
        default: return 'badge';
      }
    
    case 'service':
      switch (status.toLowerCase()) {
        case SERVICE_STATUS.COMPLETED.toLowerCase(): return 'badge badge-valid';
        case SERVICE_STATUS.DUE_SOON.toLowerCase(): return 'badge badge-expiring';
        case SERVICE_STATUS.OVERDUE.toLowerCase(): return 'badge badge-expired';
        default: return 'badge';
      }
    
    case 'vehicle':
      switch (status.toLowerCase()) {
        case 'available': return 'badge badge-available';
        case 'assigned': return 'badge badge-assigned';
        case 'maintenance': return 'badge badge-maintenance';
        case 'blocked': return 'badge badge-blocked';
        default: return 'badge';
      }
      
    default:
      return 'badge';
  }
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Set data to local storage with expiry
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} ttl - Time to live in milliseconds
 */
export const setWithExpiry = (key, value, ttl) => {
  const now = new Date();
  const item = {
    value: value,
    expiry: ttl ? now.getTime() + ttl : null,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Get data from local storage with expiry check
 * @param {string} key - Storage key
 * @returns {*} Stored value or null if expired
 */
export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  const item = JSON.parse(itemStr);
  const now = new Date();
  
  // Check for expiration
  if (item.expiry && now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  
  return item.value;
};

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Promise resolving to base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Calculate file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};