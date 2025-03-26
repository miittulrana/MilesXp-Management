// User roles
export const ROLES = {
    ADMIN: 'admin',
    DRIVER: 'driver'
  };
  
  // Vehicle status options
  export const VEHICLE_STATUS = {
    AVAILABLE: 'available',
    ASSIGNED: 'assigned',
    MAINTENANCE: 'maintenance',
    BLOCKED: 'blocked'
  };
  
  // Document types
  export const DOCUMENT_TYPES = {
    // Vehicle documents
    INSURANCE: 'insurance',
    VRT_TAG: 'vrt_tag',
    LOGBOOK: 'logbook',
    
    // Driver documents
    ID: 'id',
    LICENSE: 'license'
  };
  
  // Entity types for documents
  export const ENTITY_TYPES = {
    VEHICLE: 'vehicle',
    DRIVER: 'driver'
  };
  
  // Document status
  export const DOCUMENT_STATUS = {
    VALID: 'valid',
    EXPIRING_SOON: 'expiring_soon',
    EXPIRED: 'expired'
  };
  
  // Service status
  export const SERVICE_STATUS = {
    COMPLETED: 'completed',
    DUE_SOON: 'due_soon',
    OVERDUE: 'overdue'
  };
  
  // Assignment status
  export const ASSIGNMENT_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };
  
  // Block status
  export const BLOCK_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed'
  };
  
  // Routes
  export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    VEHICLES: '/vehicles',
    VEHICLE_DETAILS: '/vehicles/:id',
    DRIVERS: '/drivers',
    DRIVER_DETAILS: '/drivers/:id',
    DOCUMENTS: '/documents',
    DOCUMENT_STATUS: '/document-status',
    SERVICE_DUES: '/service-dues',
    ASSIGN_VEHICLE: '/assign-vehicle',
    BLOCK_VEHICLE: '/block-vehicle',
    VEHICLE_LOGS: '/vehicle-logs',
    CALENDAR: '/calendar',
    VEHICLE_TRACKING: '/vehicle-tracking',
    REPORTS: '/reports',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    NOT_FOUND: '*'
  };
  
  // Toast notification types
  export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  };
  
  // Toast durations (in milliseconds)
  export const TOAST_DURATIONS = {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 8000
  };
  
  // Local storage keys
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'fleet_auth_token',
    USER_DATA: 'fleet_user_data',
    REMEMBER_USER: 'fleet_remember_user'
  };
  
  // Date formats
  export const DATE_FORMATS = {
    DISPLAY: 'DD MMM YYYY',
    DISPLAY_WITH_TIME: 'DD MMM YYYY, hh:mm A',
    ISO: 'YYYY-MM-DD',
    ISO_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss'
  };
  
  // Service constants
  export const SERVICE_CONSTANTS = {
    NEXT_SERVICE_KM: 6000, // Next service due after 6000 km
    SERVICE_WARNING_KM: 200 // Warning when 200 km left before service
  };
  
  // Document expiry constants
  export const DOCUMENT_EXPIRY = {
    WARNING_DAYS: 30 // Days before expiry to show warning
  };
  
  // API endpoints prefixes
  export const API_ENDPOINTS = {
    USERS: 'users',
    VEHICLES: 'vehicles',
    DOCUMENTS: 'documents',
    SERVICE_RECORDS: 'service_records',
    VEHICLE_ASSIGNMENTS: 'vehicle_assignments',
    VEHICLE_BLOCKS: 'vehicle_blocks',
    VEHICLE_TRACKING: 'vehicle_tracking_logs'
  };
  
  // Pagination defaults
  export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  };
  
  // Mapbox constants (for vehicle tracking)
  export const MAPBOX = {
    STYLE: 'mapbox://styles/mapbox/streets-v11',
    ZOOM: 12
  };