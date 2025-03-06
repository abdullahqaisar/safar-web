/**
 * User preferences for route optimization
 */
export interface RoutePreferences {
  prioritizeDuration?: boolean; // Prioritize fastest route (default: true)
  prioritizeComfort?: boolean; // Prioritize comfort over speed (default: false)
  maxWalkingTime?: number; // Maximum preferred walking time in minutes (default: 15)
  preferFewerTransfers?: boolean; // Prefer routes with fewer transfers (default: true)
}

// Default preferences
export const DEFAULT_PREFERENCES: RoutePreferences = {
  prioritizeDuration: true,
  prioritizeComfort: false,
  maxWalkingTime: 15,
  preferFewerTransfers: true,
};

// Maximum number of routes to return to the user
export const MAX_ROUTES_TO_RETURN = 3;
