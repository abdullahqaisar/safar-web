import { Route, RouteSegment, TransitRouteSegment } from '../types/route';
import { TransitGraph } from '../graph/graph';
import { createRoute } from '../utils/route-builder';

/**
 * Validates and fixes routing issues:
 * 1. Removes self-loop segments
 * 2. Eliminates unnecessary transfers
 * 3. Merges redundant transit segments
 */
export function validateAndOptimizeRoute(
  route: Route,
  graph: TransitGraph
): Route | null {
  try {
    // First pass: Filter out invalid segments
    let segments = removeInvalidSegments(route.segments);

    // If no valid segments remain, return null
    if (segments.length === 0) return null;

    // Second pass: Merge consecutive transit segments on same line
    segments = mergeRedundantSegments(segments);

    // Third pass: Eliminate unnecessary transfers
    segments = eliminateUnnecessaryTransfers(segments);

    // Create a new optimized route
    return createRoute(segments);
  } catch (error) {
    console.warn('Error validating route:', error);
    // Return original route if validation fails
    return route;
  }
}

/**
 * Remove invalid segments (self-loops, empty segments, etc.)
 */
function removeInvalidSegments(segments: RouteSegment[]): RouteSegment[] {
  return segments.filter((segment) => {
    // Filter out segments with less than 2 stations
    if (segment.stations.length < 2) return false;

    // Filter out self-loop segments (same start and end station)
    if (
      segment.stations[0].id ===
      segment.stations[segment.stations.length - 1].id
    ) {
      return false;
    }

    // Keep valid segments
    return true;
  });
}

/**
 * Merge consecutive transit segments that are on the same line
 */
function mergeRedundantSegments(segments: RouteSegment[]): RouteSegment[] {
  if (segments.length < 2) return segments;

  const result: RouteSegment[] = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const prevSegment = result[result.length - 1];
    const currentSegment = segments[i];

    // Check if both segments are transit segments on the same line
    if (
      prevSegment.type === 'transit' &&
      currentSegment.type === 'transit' &&
      prevSegment.line.id === currentSegment.line.id
    ) {
      const transitPrev = prevSegment as TransitRouteSegment;
      const transitCurrent = currentSegment as TransitRouteSegment;

      // Check if the segments connect (last station of prev = first station of current)
      if (
        transitPrev.stations[transitPrev.stations.length - 1].id ===
        transitCurrent.stations[0].id
      ) {
        // Merge the segments by combining stations and summing durations
        // Note: We need to remove the duplicate station
        const mergedStations = [
          ...transitPrev.stations,
          ...transitCurrent.stations.slice(1),
        ];

        // Create a merged segment
        const mergedSegment: TransitRouteSegment = {
          type: 'transit',
          line: transitPrev.line,
          stations: mergedStations,
          duration: transitPrev.duration + transitCurrent.duration,
          stopWaitTime: transitPrev.stopWaitTime,
        };

        // Replace the previous segment with the merged segment
        result[result.length - 1] = mergedSegment;
      } else {
        // If segments don't connect, add the current segment as is
        result.push(currentSegment);
      }
    } else {
      // If segments aren't both transit on same line, add current segment as is
      result.push(currentSegment);
    }
  }

  return result;
}

/**
 * Eliminate unnecessary transfers that don't change lines
 */
function eliminateUnnecessaryTransfers(
  segments: RouteSegment[]
): RouteSegment[] {
  // We need at least 3 segments to have unnecessary transfers
  if (segments.length < 3) return segments;

  // Process the segments to find and fix unnecessary transfers
  const result: RouteSegment[] = [segments[0]];

  // Analyze segments in triplets to find unnecessary transfers
  for (let i = 1; i < segments.length - 1; i++) {
    const prevSegment = result[result.length - 1];
    const currentSegment = segments[i];
    const nextSegment = segments[i + 1];

    // Check for transit -> transit -> transit pattern
    if (
      prevSegment.type === 'transit' &&
      currentSegment.type === 'transit' &&
      nextSegment.type === 'transit'
    ) {
      // Check if first and third segments are on the same line
      if (
        (prevSegment as TransitRouteSegment).line.id ===
        (nextSegment as TransitRouteSegment).line.id
      ) {
        // Skip the middle segment if it's just a transfer at the same station
        const prevEndStation =
          prevSegment.stations[prevSegment.stations.length - 1];
        const nextStartStation = nextSegment.stations[0];

        // If the segments would connect directly, skip the middle segment
        if (
          prevEndStation.id === currentSegment.stations[0].id &&
          currentSegment.stations[currentSegment.stations.length - 1].id ===
            nextStartStation.id
        ) {
          continue;
        }
      }
    }

    // Add current segment if it's not an unnecessary transfer
    result.push(currentSegment);
  }

  // Add the last segment if we haven't processed it yet
  if (segments.length > 1) {
    const lastSegment = segments[segments.length - 1];
    result.push(lastSegment);
  }

  return result;
}

/**
 * Validates and optimizes a batch of routes
 */
export function validateAndOptimizeRoutes(
  routes: Route[],
  graph: TransitGraph
): Route[] {
  // Process each route and filter out any that become invalid
  return routes
    .map((route) => validateAndOptimizeRoute(route, graph))
    .filter((route): route is Route => route !== null);
}
