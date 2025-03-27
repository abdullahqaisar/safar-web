/**
 * Configuration for route scoring weights and thresholds
 */
export const ScoringWeights = {
  // Primary factors
  TIME: 0.45, // Total journey time weight
  TRANSFERS: 0.3, // Number of transfers weight
  WALKING: 0.15, // Total walking distance weight
  STOPS: 0.05, // Number of transit stops weight
  COMPLEXITY: 0.05, // Route complexity weight

  // Penalties
  LONG_WALK_PENALTY: 0.1, // Penalty per segment for walks > 500m
  TRANSFER_DISTANCE_PENALTY: 0.08, // Penalty for long walking transfers
  MULTIPLE_TRANSFER_PENALTY: 0.15, // Extra penalty for 2+ transfers
};

/**
 * Thresholds used in route scoring and diversity calculations
 */
export const ScoringThresholds = {
  // Walking thresholds
  SHORT_WALK_METERS: 200, // Walking distance considered short
  MEDIUM_WALK_METERS: 400, // Walking distance considered medium
  LONG_WALK_METERS: 600, // Walking distance considered long

  // Transfer thresholds
  EASY_TRANSFER_SECONDS: 90, // Transfer time considered easy
  MEDIUM_TRANSFER_SECONDS: 180, // Transfer time considered medium
  DIFFICULT_TRANSFER_SECONDS: 300, // Transfer time considered difficult

  // Diversity thresholds
  SIMILAR_DURATION_SECONDS: 90, // Routes within this time difference might be similar
  SIMILAR_SEGMENT_RATIO: 0.7, // Routes with higher segment overlap are similar
  DIVERSITY_MINIMUM_DIFFERENCE: 0.2, // Minimum difference to consider routes diverse
};

/**
 * Importance factors for interchange stations
 * Higher values indicate more important/efficient transfer points
 */
export const InterchangeImportance: Record<string, number> = {
  // Major interchange stations
  faizabad: 10, // Major hub with multiple connections
  pims_gate: 9, // Important medical center connection
  faizAhmadFaiz: 8, // Junction of Red and Orange lines
  sohan: 7,

  DEFAULT_INTERCHANGE: 5,
};

/**
 * Line quality/reliability factors
 * Higher values indicate more reliable/comfortable service
 */
export const LineQualityFactors: Record<string, number> = {
  red: 1.0, // Main line, very reliable
  blue: 0.95, // Usually reliable
  green: 0.95, // Somewhat reliable
  orange: 0.96, // Less frequent service

  // Feeder routes have lower scores as they might be less frequent/reliable
  fr_1: 0.85,
  fr_3a: 0.85,
  fr_4: 0.82,
  fr_4a: 0.8,
  fr_7: 0.83,
  fr_8a: 0.82,
  fr_8c: 0.82,
  fr_9: 0.83,
  fr_14: 0.82,
  fr_14a: 0.8,
  fr_15: 0.82,

  // Default quality factor for any new/unknown lines
  DEFAULT: 0.8,
};
