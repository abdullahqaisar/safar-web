/**
 * Configuration for route pruning strategies
 */
export const PruningThresholds = {
  /**
   * Maximum allowed deviation from the shortest route
   * A route shouldn't be X% longer than the shortest route without good reason
   */
  MAX_DISTANCE_DEVIATION: 1.4, // 40% longer than shortest route

  /**
   * Maximum allowed deviation for travel time
   * A route shouldn't take X% longer than the fastest route without good reason
   */
  MAX_DURATION_DEVIATION: 1.5, // 50% longer than fastest route

  /**
   * When two routes visit nearly the same stations in almost the same order,
   * the similarity threshold determines when one should be pruned
   */
  ROUTE_SIMILARITY_THRESHOLD: 0.85, // 85% similar stations in same sequence

  /**
   * Maximum ratio of a walking detour compared to a more direct route
   */
  MAX_WALKING_DETOUR_RATIO: 1.2, // 20% more walking than necessary

  /**
   * Minimum improvement required to justify an extra transfer
   * (e.g., route with more transfers must be X% faster to be kept)
   */
  TRANSFER_JUSTIFICATION_THRESHOLD: 0.2, // Must be 20% faster to justify extra transfer

  /**
   * Maximum number of segment alternations (transit->walking->transit->walking)
   * allowed before considering route too complex
   */
  MAX_SEGMENT_ALTERNATIONS: 4,
};

/**
 * Weights used for calculating route efficiency
 */
export const PruningWeights = {
  DISTANCE: 0.25,
  DURATION: 0.45,
  TRANSFERS: 0.3,
};

/**
 * Routes flagged for preservation - these IDs should be kept
 * even if pruning might otherwise eliminate them
 */
export const PreservedRouteTypes = [
  'FASTEST', // Fastest route
  'LEAST_WALKING', // Route with minimum walking
  'MOST_RELIABLE', // Most reliable route (highest quality metrics)
  'SIMPLEST', // Simplest route (fewest segments/transfers)
];
