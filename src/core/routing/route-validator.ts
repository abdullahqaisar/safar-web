import { Route, RouteSegment, TransitRouteSegment } from '../types/route';
import { createRoute } from '../utils/route-builder';

/**
 * Validates and fixes routing issues:
 * 1. Removes self-loop segments
 * 2. Eliminates unnecessary transfers
 * 3. Merges redundant transit segments
 * 4. Detects and fixes complex circular patterns
 * 5. Ensures route starts at the requested origin
 */
export function validateAndOptimizeRoute(route: Route): Route | null {
  try {
    // Check if the route starts at the requested origin (if specified)
    if (
      route.requestedOrigin &&
      route.segments.length > 0 &&
      route.segments[0].stations[0].id !== route.requestedOrigin
    ) {
      // Route doesn't start at the requested origin, reject it
      return null;
    }

    // First pass: Filter out invalid segments
    let segments = removeInvalidSegments(route.segments);

    // If no valid segments remain, return null
    if (segments.length === 0) return null;

    // Second pass: Merge consecutive transit segments on same line
    segments = mergeRedundantSegments(segments);

    // Third pass: Eliminate unnecessary transfers including complex patterns
    segments = eliminateUnnecessaryTransfers(segments);

    // Fourth pass: Detect and eliminate complex circular patterns
    segments = eliminateComplexCircularPatterns(segments);

    // Create a new optimized route, preserving the requestedOrigin
    const optimizedRoute = createRoute(segments, route);
    return optimizedRoute;
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
          // For ticket cost, since it's usually a flat fare per line,
          // we should use the maximum of the two rather than adding them
          ticketCost: Math.max(
            transitPrev.ticketCost || 0,
            transitCurrent.ticketCost || 0
          ),
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
 * Detect and eliminate complex circular patterns in routes
 * Handles patterns like A→B→C→A where a route eventually returns to a line
 * it previously traveled on, creating an unnecessary loop
 */
function eliminateComplexCircularPatterns(
  segments: RouteSegment[]
): RouteSegment[] {
  if (segments.length < 3) return segments;

  // Extract only transit segments for analysis
  const transitSegments = segments.filter(
    (segment): segment is TransitRouteSegment => segment.type === 'transit'
  );

  // If fewer than 3 transit segments, no complex patterns to detect
  if (transitSegments.length < 3) return segments;

  // Track the sequence of lines and the stations where they start
  type LineInstance = {
    lineId: string;
    segmentIndex: number;
    startStationId: string;
    endStationId: string;
  };

  const lineSequence: LineInstance[] = [];

  // Build a sequence of transit lines and their entry/exit stations
  segments.forEach((segment, index) => {
    if (segment.type === 'transit') {
      const transitSegment = segment as TransitRouteSegment;
      lineSequence.push({
        lineId: transitSegment.line.id,
        segmentIndex: index,
        startStationId: transitSegment.stations[0].id,
        endStationId:
          transitSegment.stations[transitSegment.stations.length - 1].id,
      });
    }
  });

  // Look for circular patterns where we return to a line we've already used
  const circularPatterns: number[][] = []; // Stores segment indexes to remove

  for (let i = 0; i < lineSequence.length - 2; i++) {
    const firstLineInstance = lineSequence[i];

    // Look for later instances of the same line
    for (let j = i + 2; j < lineSequence.length; j++) {
      const laterLineInstance = lineSequence[j];

      // Check if we've returned to the same line
      if (firstLineInstance.lineId === laterLineInstance.lineId) {
        // We found a potential circular pattern (format: A → ... → A)

        // Only mark it as unnecessary if:
        // 1. Second visit to the line is continuing in the same direction
        // 2. The intermediate transfers didn't bring us to a useful different part of the line

        // Check for station sequence to determine if this is a true circular pattern
        // by comparing station IDs or checking if we're backtracking

        // Check for strict circular pattern - returning to exactly the same station
        const isCircular =
          laterLineInstance.startStationId === firstLineInstance.endStationId;

        // If it's definitely circular, mark the segments in between for removal
        if (isCircular) {
          const segmentsToRemove: number[] = [];
          // Mark all intermediate segments for removal
          for (
            let k = firstLineInstance.segmentIndex + 1;
            k < laterLineInstance.segmentIndex;
            k++
          ) {
            segmentsToRemove.push(k);
          }
          circularPatterns.push(segmentsToRemove);
          break; // Found the earliest circular pattern, stop looking
        }
      }
    }
  }

  // If no circular patterns found, return the original segments
  if (circularPatterns.length === 0) {
    return segments;
  }

  // Filter out the segments that are part of unnecessary circular patterns
  // Using the first (earliest) circular pattern
  if (circularPatterns.length > 0) {
    const segmentsToRemove = new Set(circularPatterns[0]);
    return segments.filter((_, index) => !segmentsToRemove.has(index));
  }

  return segments;
}

/**
 * Validates and optimizes a batch of routes
 */
export function validateAndOptimizeRoutes(routes: Route[]): Route[] {
  // Process each route and filter out any that become invalid
  return routes
    .map((route) => validateAndOptimizeRoute(route))
    .filter((route): route is Route => route !== null);
}
