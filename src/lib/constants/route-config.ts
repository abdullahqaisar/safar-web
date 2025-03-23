/**
 * Configuration constants for route planning and optimization
 */

// Distance thresholds (in meters)
export const DISTANCE_THRESHOLDS = {
  VERY_SHORT: 500,
  MEDIUM_MIN: 500,
  MEDIUM_MAX: 2000,
  LONG: 2000,
};

// Walking distance limits for scoring
export const WALKING_SCORE_THRESHOLDS = {
  EXCELLENT: 0,
  GOOD: 300,
  ACCEPTABLE: 500,
  FAIR: 1000,
  POOR: 2000,
};

// Duration multiplier for route filtering
export const DURATION_MULTIPLIER = 1.4;

// Route similarity threshold (0-1, higher means more similar)
export const ROUTE_SIMILARITY_THRESHOLD = 0.5;

// Weights for calculating route similarity
export const SIMILARITY_WEIGHTS = {
  LINE: 0.5,
  KEY_STATION: 0.3,
  SEGMENT_COUNT: 0.2,
};

// Transfer penalties for scoring
export const TRANSFER_PENALTIES = [0, 15, 40, 70, 100];

// Weights for route optimization
export const OPTIMIZE = {
  TRANSFER_WEIGHT: 0.65,
  WALKING_WEIGHT: 0.35,
};

// Transit graph connection settings
export const TRANSIT_CONNECTION = {
  VIRTUAL_NODE_DISTANCE_MULTIPLIER: 1.5,
  CLOSEST_STATION_MULTIPLIER: 2.0,
  DURATION_BONUS: 0.95,
};

// Transfer time settings (seconds)
export const TRANSFER_TIME = {
  BASE: 90,
  PER_LINE: 15,
};

// Walking segment thresholds
export const WALKING_SEGMENT_PENALTIES = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 1500,
  VERY_LONG: 2000,
  EXTREME: 2500,
};

// Maximum number of paths to attempt to find during routing
export const MAX_PATHS_TO_FIND = 5;

/**
 * Walking shortcut distance thresholds (in meters)
 */
export const WALKING_SHORTCUTS = {
  /**
   * The maximum distance for walking shortcuts between stations
   * Any explicitly defined shortcuts will use this threshold
   */
  MAX_DISTANCE: 800,

  /**
   * The threshold above which a walking segment is considered "long"
   * Used for scoring and penalties in route selection
   */
  LONG_THRESHOLD: 500,
};
