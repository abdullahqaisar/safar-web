export const MAX_STATION_DISTANCE = 8; // kilometers

/**
 * Maximum number of transfers to allow in routes
 */
export const MAX_TRANSFERS = 3;

// Distance Matrix API URL
export const DISTANCE_MATRIX_API_URL =
  'https://maps.googleapis.com/maps/api/distancematrix/json';

// Maximum number of routes to return to the user
export const MAX_ROUTES_TO_RETURN = 3;

// Average wait time at each stop in seconds
export const STOP_WAIT_TIME_SECONDS = 20;

// Walking distance thresholds (meters)
export const MAX_WALKING_DISTANCE = 10000; // Maximum overall walking distance
export const MAX_ORIGIN_WALKING_DISTANCE = 9000; // Shorter distance from origin
export const MAX_DESTINATION_WALKING_DISTANCE = 9000; // Longer distance at destination

// Speeds
export const WALKING_SPEED_MPS = 1.4; // Average walking speed (meters/second)

// Route finding settings
export const MAX_ROUTES_TO_GENERATE = 10; // Maximum number of routes to generate
