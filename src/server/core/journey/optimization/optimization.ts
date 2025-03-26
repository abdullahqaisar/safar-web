import { Route } from '@/types/route';
import {
  calculateComfortScore,
  calculateRouteScore,
} from '../optimization/scoring';
import { MAX_ROUTES_TO_RETURN, MAX_TRANSFERS } from '@/lib/constants/config';
import { v4 as uuidv4 } from 'uuid';
import {
  DURATION_MULTIPLIER,
  ROUTE_SIMILARITY_THRESHOLD,
} from '@/lib/constants/route-config';
import {
  findFastestRoute,
  findMinTransfersRoute,
  findTransitRoute,
  countTransfers,
  calculateRouteSimilarity,
  handleWalkingTransitFiltering,
  getFallbackRoutes,
  ensurePriorityRoutes,
} from '@/server/core/shared/optimization.utils';
import {
  calculateLineCoverageScore,
  areRoutesComplementary,
  usesPrimaryLines,
  usesSecondaryLines,
} from '@/server/core/shared/line-utils';

export function filterAndRankRoutes(
  routes: Route[],
  isVeryShortDistance = false,
  isMediumDistance = false,
  isLongDistance = false
): Route[] {
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  if (validRoutes.length === 0) {
    return [];
  }

  validRoutes.forEach((route) => {
    if (!route.id) {
      route.id = uuidv4();
    }
  });

  const directWalkRoutes = validRoutes.filter((r) => r.isDirectWalk === true);
  const nonDirectWalkRoutes = validRoutes.filter(
    (r) => r.isDirectWalk !== true
  );

  const filteredRoutes = filterRoutesByQuality(nonDirectWalkRoutes);
  const rankedRoutes = rankRoutes(filteredRoutes);

  // Ensure routes have good line diversity using our improved classification system
  let diverseRoutes = ensureRouteDiversity(
    rankedRoutes,
    isMediumDistance || isLongDistance
  );

  if (isLongDistance) {
    diverseRoutes = processLongDistanceRoutes(diverseRoutes, directWalkRoutes);
  } else if (isMediumDistance || isVeryShortDistance) {
    diverseRoutes = processShortMediumDistanceRoutes(
      diverseRoutes,
      directWalkRoutes
    );
  }

  return diverseRoutes.slice(0, MAX_ROUTES_TO_RETURN);
}

function processLongDistanceRoutes(
  diverseRoutes: Route[],
  directWalkRoutes: Route[]
): Route[] {
  if (directWalkRoutes.length === 0 || diverseRoutes.length === 0) {
    return diverseRoutes;
  }

  const bestDirectWalk = directWalkRoutes[0];

  // Check for transit routes with primary lines
  const hasPrimaryTransitRoute = diverseRoutes.some(
    (route) =>
      route.segments.some((segment) => segment.type === 'transit') &&
      usesPrimaryLines(route)
  );

  // For long trips, also ensure we have at least one route with secondary lines if possible
  const hasSecondaryTransitRoute = diverseRoutes.some(
    (route) =>
      route.segments.some((segment) => segment.type === 'transit') &&
      usesSecondaryLines(route)
  );

  if (!hasPrimaryTransitRoute) {
    const transitRoute = findTransitRoute(diverseRoutes);
    if (transitRoute) {
      diverseRoutes.unshift(transitRoute);
    }
  }

  const includeWalking =
    bestDirectWalk.totalDuration < diverseRoutes[0].totalDuration * 0.8 ||
    !hasPrimaryTransitRoute;

  // If walking is compelling or we lack good transit options, include the walking route
  if (includeWalking) {
    diverseRoutes.push(bestDirectWalk);
  }

  // If we're missing routes with secondary lines, try to add one
  if (
    !hasSecondaryTransitRoute &&
    diverseRoutes.length < MAX_ROUTES_TO_RETURN
  ) {
    const secondaryRoute = diverseRoutes.find(
      (route) => !diverseRoutes.includes(route) && usesSecondaryLines(route)
    );

    if (secondaryRoute) {
      diverseRoutes.push(secondaryRoute);
    }
  }

  return diverseRoutes;
}

function processShortMediumDistanceRoutes(
  diverseRoutes: Route[],
  directWalkRoutes: Route[]
): Route[] {
  if (directWalkRoutes.length === 0) {
    return diverseRoutes;
  }

  const bestDirectWalk = directWalkRoutes[0];

  if (diverseRoutes.length === 0) {
    return [bestDirectWalk];
  }

  const walkIsFaster =
    bestDirectWalk.totalDuration < diverseRoutes[0].totalDuration * 1.1;

  if (walkIsFaster) {
    diverseRoutes.unshift(bestDirectWalk);
  } else {
    diverseRoutes.push(bestDirectWalk);
  }

  return diverseRoutes;
}

// Add a helper function to identify routes with walking shortcuts
function identifyRoutesWithWalkingShortcuts(routes: Route[]): Route[] {
  return routes.filter((route) => {
    // Check if the route has any walking segments between stations (not origin/destination)
    return route.segments.some(
      (segment) => segment.type === 'walk' && segment.isShortcut === true
    );
  });
}

function filterRoutesByQuality(routes: Route[]): Route[] {
  if (routes.length === 0) {
    return [];
  }

  // Get benchmark routes
  const fastestRoute = findFastestRoute(routes);
  const minTransfersRoute = findMinTransfersRoute(routes);

  // Find routes with walking shortcuts that might save transfers
  const walkingShortcutRoutes = identifyRoutesWithWalkingShortcuts(routes);

  // Sort shortcut routes by duration to find the most efficient ones
  const efficientShortcutRoutes = walkingShortcutRoutes
    .filter((route) => route.totalDuration <= fastestRoute.totalDuration * 1.3)
    .sort((a, b) => a.totalDuration - b.totalDuration);

  // Get comfort scores
  const comfortScores = routes.map((route) => ({
    route,
    comfort: calculateComfortScore(route),
  }));

  const mostComfortableRoute = comfortScores.reduce(
    (most, current) => (current.comfort > most.comfort ? current : most),
    comfortScores[0]
  ).route;

  // Apply duration filters with more generous threshold for routes with walking shortcuts
  const durationThreshold = fastestRoute.totalDuration * DURATION_MULTIPLIER;
  let filtered = routes.filter((route) => {
    const hasWalkingShortcut = walkingShortcutRoutes.includes(route);

    // Allow longer duration for routes with walking shortcuts
    // More generous allowance based on how many transfers are saved
    const transferDiff = Math.max(
      0,
      countTransfers(minTransfersRoute) - countTransfers(route)
    );
    const shortcutBonus = hasWalkingShortcut ? 1.1 + transferDiff * 0.1 : 1.0;

    const routeThreshold = durationThreshold * shortcutBonus;
    return route.totalDuration <= routeThreshold;
  });

  // Apply transfers filter with consideration for walking shortcuts
  const minTransfers = countTransfers(minTransfersRoute);
  const transfersThreshold = Math.min(
    MAX_TRANSFERS,
    minTransfers + (minTransfers < 2 ? 2 : 1)
  );

  filtered = filtered.filter(
    (route) => countTransfers(route) <= transfersThreshold
  );

  // Special handling for walking vs. transit
  filtered = handleWalkingTransitFiltering(filtered);

  // Ensure we haven't filtered out all routes
  if (filtered.length === 0) {
    return getFallbackRoutes(routes, fastestRoute);
  }

  // Ensure we include priority routes
  const priorityRoutes = [
    fastestRoute,
    minTransfersRoute,
    mostComfortableRoute,
    // Add best walking shortcut route to priorities if it exists
    ...(efficientShortcutRoutes.length > 0 ? [efficientShortcutRoutes[0]] : []),
  ];

  return ensurePriorityRoutes(filtered, ...priorityRoutes);
}

function rankRoutes(routes: Route[]): Route[] {
  const validRoutes = routes.filter((route) => route.totalDuration > 0);

  if (validRoutes.length === 0) {
    return [];
  }

  return validRoutes
    .map((route) => {
      const score = calculateRouteScore(route);
      return { route, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.route);
}

function ensureRouteDiversity(
  routes: Route[],
  enforceModeDiversity = false
): Route[] {
  if (routes.length <= 1) return routes;

  const result: Route[] = [routes[0]];

  // First ensure mode diversity if requested (transit vs walking)
  if (enforceModeDiversity) {
    const firstIsTransit = routes[0].segments.some((s) => s.type === 'transit');
    const needsMode = firstIsTransit ? 'walk' : 'transit';

    const oppositeMode = routes
      .slice(1)
      .find((route) =>
        needsMode === 'walk'
          ? !route.segments.some((s) => s.type === 'transit')
          : route.segments.some((s) => s.type === 'transit')
      );

    if (oppositeMode) {
      result.push(oppositeMode);
    }
  }

  // Then ensure line diversity using our enhanced metrics
  for (
    let i = 1;
    i < routes.length && result.length < MAX_ROUTES_TO_RETURN;
    i++
  ) {
    if (result.includes(routes[i])) continue;

    const candidate = routes[i];

    // Skip routes that are too similar to already selected routes
    let isSignificantlyDifferent = true;
    let isComplementary = false;

    for (const selectedRoute of result) {
      // Check basic similarity
      const similarity = calculateRouteSimilarity(candidate, selectedRoute);

      if (similarity > ROUTE_SIMILARITY_THRESHOLD) {
        isSignificantlyDifferent = false;
        break;
      }

      // Check if this route complements existing routes by covering different line types
      if (areRoutesComplementary(candidate, selectedRoute)) {
        isComplementary = true;
      }
    }

    // Include routes that are different or complementary
    if (isSignificantlyDifferent || isComplementary) {
      result.push(candidate);
    }
  }

  // Calculate line coverage score for all routes
  const scoredRoutes = result.map((route) => ({
    route,
    coverage: calculateLineCoverageScore(route),
  }));

  // Sort by coverage score (descending) while preserving the first route
  const firstRoute = scoredRoutes[0];
  const restRoutes = scoredRoutes
    .slice(1)
    .sort((a, b) => b.coverage - a.coverage);

  // Return the sorted routes
  return [firstRoute.route, ...restRoutes.map((r) => r.route)];
}
