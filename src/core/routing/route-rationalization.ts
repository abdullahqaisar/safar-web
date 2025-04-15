import { Route } from '../types/route';
import { calculateDistance } from '../utils/geo-utils';
import { TransitGraph } from '../graph/graph';

/**
 * Issues that can be detected by route rationalization
 */
export type RouteRationalizationIssue =
  | 'DESTINATION_PASSTHROUGH' // Route passes through destination before reaching it
  | 'SIGNIFICANT_BACKTRACKING' // Route backtracks significantly from its general direction
  | 'GEOGRAPHIC_DETOUR' // Route takes a significant geographic detour
  | 'U_TURN_PATTERN'; // Route contains a U-turn pattern

/**
 * Result of a route rationalization analysis
 */
interface RouteRationalizationResult {
  hasIssues: boolean;
  issues: RouteRationalizationIssue[];
  score: number; // Higher score means more issues (0-100)
}

/**
 * Check if a route passes through the destination station before reaching it
 */
export function detectDestinationPassthrough(
  route: Route,
  destinationId: string
): boolean {
  // Skip the final segment when checking
  const segmentsToCheck = route.segments.slice(0, -1);

  // Check all stations in all segments except the last one
  for (const segment of segmentsToCheck) {
    // Check if any station in this segment is the destination
    for (let i = 0; i < segment.stations.length - 1; i++) {
      if (segment.stations[i].id === destinationId) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect if a route has a significant amount of geographic backtracking
 * Uses the bearing between consecutive stations to detect direction changes
 */
export function detectSignificantBacktracking(
  route: Route,
  graph: TransitGraph,
  destinationId: string
): boolean {
  // Get destination coordinates
  const destination = graph.stations[destinationId];
  if (!destination) return false;

  // Get all stations in order
  const allStations = route.segments.flatMap((segment) => segment.stations);
  if (allStations.length < 3) return false; // Need at least 3 stations to detect backtracking

  // Calculate cumulative progress toward destination
  let lastDistance = calculateDistance(
    allStations[0].coordinates,
    destination.coordinates
  );
  let backtrackingCount = 0;
  let significantBacktrackingDistance = 0;

  for (let i = 1; i < allStations.length; i++) {
    const currentStation = allStations[i];
    const currentDistance = calculateDistance(
      currentStation.coordinates,
      destination.coordinates
    );

    // If we're moving away from destination
    if (currentDistance > lastDistance) {
      const backtrackAmount = currentDistance - lastDistance;
      backtrackingCount++;
      significantBacktrackingDistance += backtrackAmount;
    }

    lastDistance = currentDistance;
  }

  // If backtracking is more than 30% of the total route distance or occurs in more than 40% of steps
  return (
    significantBacktrackingDistance > route.totalDistance * 0.3 ||
    (backtrackingCount > 0 &&
      backtrackingCount / (allStations.length - 1) > 0.4)
  );
}

/**
 * Detect if a route contains a U-turn pattern (going to a station and then returning on the same or different line)
 */
export function detectUTurnPattern(route: Route): boolean {
  // Check for stations that are visited more than once
  const stationVisits = new Map<string, number>();

  route.segments.forEach((segment) => {
    segment.stations.forEach((station) => {
      stationVisits.set(station.id, (stationVisits.get(station.id) || 0) + 1);
    });
  });

  // If any station is visited more than once, likely a U-turn
  return Array.from(stationVisits.values()).some((count) => count > 1);
}

/**
 * Check if a route is geographically rational by analyzing its progression toward the destination
 */
export function analyzeRouteRationality(
  route: Route,
  graph: TransitGraph,
  destinationId?: string
): RouteRationalizationResult {
  const issues: RouteRationalizationIssue[] = [];
  let score = 0;

  // If no destination ID is provided, we can't check for rationality issues
  if (!destinationId) {
    return {
      hasIssues: false,
      issues: [],
      score: 0,
    };
  }

  console.log(`[Rationality] Analyzing route ${route.id}`);

  // Check for destination pass-through
  if (detectDestinationPassthrough(route, destinationId)) {
    issues.push('DESTINATION_PASSTHROUGH');
    score += 50; // Major issue
  }

  console.log(`[Rationality] Route ${route.id} has ${issues.length} issues`);

  // Check for significant backtracking
  if (detectSignificantBacktracking(route, graph, destinationId)) {
    issues.push('SIGNIFICANT_BACKTRACKING');
    score += 40;
  }

  console.log(`[Rationality] Route ${route.id} has ${issues.length} issues`);

  // Check for U-turn patterns
  if (detectUTurnPattern(route)) {
    issues.push('U_TURN_PATTERN');
    score += 30;
  }

  // Cap the score at 100
  score = Math.min(score, 100);

  return {
    hasIssues: issues.length > 0,
    issues,
    score,
  };
}

/**
 * Filter out irrational routes from a collection
 */
export function filterIrrationalRoutes(
  routes: Route[],
  graph: TransitGraph,
  destinationId?: string
): Route[] {
  console.log(
    `[Rationality] Filtering ${routes.length} routes for rationality`
  );
  // If no destination ID is provided, we can't filter based on rationality
  if (!destinationId) {
    return routes;
  }

  return routes.filter((route) => {
    const analysis = analyzeRouteRationality(route, graph, destinationId);

    // If the route has serious issues, filter it out
    // A passthrough of the destination is always rejected
    if (analysis.issues.includes('DESTINATION_PASSTHROUGH')) {
      return false;
    }

    console.log(
      `[Rationality] Route ${route.id} has ${analysis.issues.length} issues`
    );

    // If there are multiple rationality issues, filter out the route
    return analysis.issues.length < 2;
  });
}
