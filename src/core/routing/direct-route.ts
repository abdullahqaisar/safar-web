import { TransitGraph } from '../graph/graph';
import { Route } from '../types/route';
import { createRoute, createTransitSegment } from '../utils/route-builder';

export function findDirectRoutes(
  graph: TransitGraph,
  originId: string,
  destinationId: string
): Route[] {
  const routes: Route[] = [];
  console.log(
    `[Direct Route] Searching for direct routes from ${originId} (${graph.stations[originId]?.name || 'unknown'}) to ${destinationId} (${graph.stations[destinationId]?.name || 'unknown'})`
  );

  // Get origin and destination stations
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];

  if (!origin || !destination) {
    console.log(
      `[Direct Route] Invalid origin or destination station: origin=${!!origin}, destination=${!!destination}`
    );
    return routes;
  }

  // Get lines for both stations from the graph
  const originLines = graph.getStationLines(originId);
  const destLines = graph.getStationLines(destinationId);
  console.log(`[Direct Route] Origin lines: ${originLines.join(', ')}`);
  console.log(`[Direct Route] Destination lines: ${destLines.join(', ')}`);

  // Find common lines
  const commonLines = originLines.filter((lineId) =>
    destLines.includes(lineId)
  );
  console.log(
    `[Direct Route] Common lines between origin and destination: ${commonLines.join(', ')}`
  );

  // For each common line, try to find a direct route
  commonLines.forEach((lineId) => {
    const line = graph.lines[lineId];
    if (!line) {
      console.log(`[Direct Route] Line ${lineId} not found in graph`);
      return;
    }

    const stations = line.stations;
    const originIndex = stations.indexOf(originId);
    const destIndex = stations.indexOf(destinationId);
    console.log(
      `[Direct Route] Line ${lineId}: originIndex=${originIndex}, destIndex=${destIndex}`
    );

    // Skip if any station is not found in the line
    if (originIndex === -1 || destIndex === -1) {
      console.log(
        `[Direct Route] One or both stations not found in line ${lineId}`
      );
      return;
    }

    // Create forward route if destination comes after origin
    if (destIndex > originIndex) {
      console.log(
        `[Direct Route] Creating forward route on line ${lineId} (${line.name})`
      );
      const stationsSlice = stations.slice(originIndex, destIndex + 1);
      console.log(`[Direct Route] Station path: ${stationsSlice.join(' → ')}`);

      const routeSegment = createTransitSegment(
        graph,
        line,
        stations.slice(originIndex, destIndex + 1)
      );

      if (routeSegment) {
        const route = createRoute([routeSegment], {
          requestedOrigin: originId,
        } as Route);
        console.log(
          `[Direct Route] Created direct route: ID=${route.id}, duration=${route.totalDuration}s, distance=${route.totalDistance}m, stops=${route.totalStops}`
        );
        routes.push(route);
      } else {
        console.log(
          `[Direct Route] Failed to create transit segment for line ${lineId}`
        );
      }
    }
    // Create reverse route if origin comes after destination
    else if (originIndex > destIndex) {
      console.log(
        `[Direct Route] Creating reverse route on line ${lineId} (${line.name})`
      );
      const stationIds = stations.slice(destIndex, originIndex + 1).reverse();
      console.log(`[Direct Route] Station path: ${stationIds.join(' → ')}`);

      const routeSegment = createTransitSegment(graph, line, stationIds);

      if (routeSegment) {
        const route = createRoute([routeSegment], {
          requestedOrigin: originId,
        } as Route);
        console.log(
          `[Direct Route] Created direct route: ID=${route.id}, duration=${route.totalDuration}s, distance=${route.totalDistance}m, stops=${route.totalStops}`
        );
        routes.push(route);
      } else {
        console.log(
          `[Direct Route] Failed to create transit segment for line ${lineId}`
        );
      }
    }
  });

  console.log(
    `[Direct Route] Found ${routes.length} direct routes from ${originId} to ${destinationId}`
  );
  return routes;
}
