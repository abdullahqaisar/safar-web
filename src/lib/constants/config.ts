/**
 * Global application configuration constants
 */

// API endpoints
export const DISTANCE_MATRIX_API_URL =
  'https://maps.googleapis.com/maps/api/distancematrix/json';

// Route limits
export const MAX_ROUTES_TO_RETURN = 3;
export const MAX_ROUTES_TO_GENERATE = 10;
export const MAX_TRANSFERS = 3;

// Station constants
export const MAX_STATION_DISTANCE = 10000; // kilometers
export const STOP_WAIT_TIME_SECONDS = 20;

// Walking constants
export const MAX_WALKING_DISTANCE = 10000; // Maximum for direct walking routes
export const MAX_ORIGIN_WALKING_DISTANCE = 10000; // Default upper limit
export const MAX_DESTINATION_WALKING_DISTANCE = 10000; // Default upper limit
export const WALKING_SPEED_MPS = 1.4; // meters/second

/**
 * Maximum distance (in meters) for auto-discovered walking shortcuts
 * This is intentionally stricter than the explicit shortcuts
 */
export const MAX_AUTO_WALKING_SHORTCUT_DISTANCE = 600;
