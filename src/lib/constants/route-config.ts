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

/**
 * Critical transfer configurations between metro lines
 * Lower values mean more aggressive cost reduction (0.1 = 90% reduction)
 */
export const CRITICAL_TRANSFERS: Record<string, number> = {
  // Principal transfers between primary lines
  'red-orange': 0.15, // Critical Red-Orange transfer
  'orange-red': 0.15, // Critical Orange-Red transfer
  'green-blue': 0.3, // Important Green-Blue transfer
  'blue-green': 0.3, // Important Blue-Green transfer

  // Secondary important transfers
  'red-blue': 0.4,
  'blue-red': 0.4,
  'red-green': 0.4,
  'green-red': 0.4,
  'orange-blue': 0.5,
  'blue-orange': 0.5,
  'orange-green': 0.5,
  'green-orange': 0.5,
};

/**
 * Priority levels for each line (higher = more important)
 */
export const LINE_PRIORITY: Record<string, number> = {
  red: 10, // Highest priority
  orange: 9, // Very high priority
  green: 8, // High priority
  blue: 8, // High priority
  // Secondary lines would have lower priorities (5-7)
  // Tertiary/feeder lines would have lowest priorities (1-4)
};

/**
 * Interchange station importance levels
 * Contains transfer importance and per-line-pair special weightings
 */
export const INTERCHANGE_CONFIG = {
  // Transfer importance multipliers for different importance levels
  importanceMultipliers: {
    critical: 0.2, // 80% reduction
    major: 0.3, // 70% reduction
    standard: 0.5, // 50% reduction
    minor: 0.8, // 20% reduction
  },

  // Special transfer pairs at specific interchanges (station-lineA-lineB)
  specialTransfers: [
    {
      stationId: 'faizAhmadFaiz',
      linePair: ['red', 'orange'],
      multiplier: 0.1, // 90% reduction
    },
    {
      stationId: 'pims_gate',
      linePair: ['green', 'blue'],
      multiplier: 0.2, // 80% reduction
    },
  ],
};
