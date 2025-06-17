// API Configuration
export const API_CONFIG = {
  // Base URL for all API requests
  BASE_URL: import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api',
  
  // Authentication endpoints
  AUTH: {
    LOGIN: 'auth/login.php',
    LOGOUT: 'auth/logout.php',
    REFRESH_TOKEN: 'auth/refresh-token.php',
  },
  
  // User management endpoints
  USERS: {
    BASE: 'users',
    PROFILE: 'users/profile',
    CHANGE_PASSWORD: 'users/change-password',
  },
  
  // Public users endpoints
  PUBLIC_USERS: 'public-users',
  
  // Departments
  DEPARTMENTS: 'departments',
  
  // Divisions
  DIVISIONS: 'divisions',
  
  // Service catalog
  SERVICES: 'services',
  
  // Tokens
  TOKENS: 'tokens',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  
  // Registry
  REGISTRY: 'registry',
  
  // Default request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Max retries for failed requests
  MAX_RETRIES: 3,
};

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

// Helper function to build API URL
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading/trailing slashes from endpoint
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  return `${API_CONFIG.BASE_URL.replace(/\/+$/, '')}/${cleanEndpoint}`;
};
