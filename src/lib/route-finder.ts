import { metroLines, MetroLineColor, stationCoordinates } from './metro-data';

export interface RouteSegment {
  line: MetroLineColor;
  from: string;
  to: string;
  stations: string[];
}

export interface Route {
  segments: RouteSegment[];
  totalStops: number;
}

// Find lines that contain a specific station
export function findLinesForStation(station: string): MetroLineColor[] {
  const lines: MetroLineColor[] = [];

  for (const lineKey in metroLines) {
    const line = metroLines[lineKey];
    if (line.stations.includes(station)) {
      lines.push(lineKey as MetroLineColor);
    }
  }

  return lines;
}

// Find interchange stations between two lines
export function findInterchanges(
  line1: MetroLineColor,
  line2: MetroLineColor
): string[] {
  const interchangeStations: string[] = [];

  const line1Stations = metroLines[line1].stations;
  const line2Stations = metroLines[line2].stations;

  for (const station of line1Stations) {
    if (line2Stations.includes(station)) {
      interchangeStations.push(station);
    }
  }

  return interchangeStations;
}

// Find all possible routes between two stations
export function findTransferRoutes(
  fromStation: string,
  toStation: string,
  maxTransfers = 2
): Route[] {
  const possibleRoutes: Route[] = [];

  // Get lines for start and end stations
  const fromLines = findLinesForStation(fromStation);
  const toLines = findLinesForStation(toStation);

  // Try direct routes with one transfer
  for (const fromLine of fromLines) {
    for (const toLine of toLines) {
      if (fromLine === toLine) {
        // Direct route on same line - we handle this elsewhere
        continue;
      }

      // Find interchange stations between these lines
      const transfers = findInterchanges(fromLine, toLine);

      for (const transfer of transfers) {
        const fromLineStations = metroLines[fromLine].stations;
        const toLineStations = metroLines[toLine].stations;

        const fromIndex = fromLineStations.indexOf(fromStation);
        const transferIndexOnFromLine = fromLineStations.indexOf(transfer);
        const transferIndexOnToLine = toLineStations.indexOf(transfer);
        const toIndex = toLineStations.indexOf(toStation);

        // If all stations are found
        if (
          fromIndex !== -1 &&
          transferIndexOnFromLine !== -1 &&
          transferIndexOnToLine !== -1 &&
          toIndex !== -1
        ) {
          // Generate route segments
          const segments: RouteSegment[] = [];

          // First segment: from start to transfer
          let segment1Stations: string[] = [];
          if (fromIndex < transferIndexOnFromLine) {
            segment1Stations = fromLineStations.slice(
              fromIndex,
              transferIndexOnFromLine + 1
            );
          } else {
            segment1Stations = fromLineStations
              .slice(transferIndexOnFromLine, fromIndex + 1)
              .reverse();
          }

          segments.push({
            line: fromLine,
            from: fromStation,
            to: transfer,
            stations: segment1Stations,
          });

          // Second segment: from transfer to destination
          let segment2Stations: string[] = [];
          if (transferIndexOnToLine < toIndex) {
            segment2Stations = toLineStations.slice(
              transferIndexOnToLine,
              toIndex + 1
            );
          } else {
            segment2Stations = toLineStations
              .slice(toIndex, transferIndexOnToLine + 1)
              .reverse();
          }

          segments.push({
            line: toLine,
            from: transfer,
            to: toStation,
            stations: segment2Stations,
          });

          // Calculate total stops
          const totalStops =
            segment1Stations.length + segment2Stations.length - 2; // -2 because we don't want to count transfer stations twice

          possibleRoutes.push({
            segments: segments,
            totalStops: totalStops,
          });
        }
      }
    }
  }

  // If no direct transfer routes found and we can try more transfers
  if (possibleRoutes.length === 0 && maxTransfers > 1) {
    // Try routes with two transfers
    const secondDegreeLines = new Set<string>();

    // Find all lines that connect to start lines
    for (const fromLine of fromLines) {
      for (const lineKey in metroLines) {
        const line = lineKey as MetroLineColor;
        if (fromLine !== line && findInterchanges(fromLine, line).length > 0) {
          secondDegreeLines.add(line);
        }
      }
    }

    // For each second degree line, try to find a path to destination lines
    for (const middleLine of Array.from(
      secondDegreeLines
    ) as MetroLineColor[]) {
      for (const toLine of toLines) {
        if (middleLine === toLine) continue;

        const transfers = findInterchanges(middleLine, toLine);
        if (transfers.length > 0) {
          // For each fromLine to middleLine connection
          for (const fromLine of fromLines) {
            const firstTransfers = findInterchanges(fromLine, middleLine);

            for (const firstTransfer of firstTransfers) {
              for (const secondTransfer of transfers) {
                // Build the 3-segment route
                try {
                  const segments: RouteSegment[] = [];

                  // First segment: from start to first transfer
                  const fromLineStations = metroLines[fromLine].stations;
                  const fromIndex = fromLineStations.indexOf(fromStation);
                  const transferIndexOnFromLine =
                    fromLineStations.indexOf(firstTransfer);

                  let segment1Stations: string[] = [];
                  if (fromIndex < transferIndexOnFromLine) {
                    segment1Stations = fromLineStations.slice(
                      fromIndex,
                      transferIndexOnFromLine + 1
                    );
                  } else {
                    segment1Stations = fromLineStations
                      .slice(transferIndexOnFromLine, fromIndex + 1)
                      .reverse();
                  }

                  segments.push({
                    line: fromLine,
                    from: fromStation,
                    to: firstTransfer,
                    stations: segment1Stations,
                  });

                  // Second segment: from first transfer to second transfer
                  const middleLineStations = metroLines[middleLine].stations;
                  const firstTransferOnMiddleLine =
                    middleLineStations.indexOf(firstTransfer);
                  const secondTransferOnMiddleLine =
                    middleLineStations.indexOf(secondTransfer);

                  let segment2Stations: string[] = [];
                  if (firstTransferOnMiddleLine < secondTransferOnMiddleLine) {
                    segment2Stations = middleLineStations.slice(
                      firstTransferOnMiddleLine,
                      secondTransferOnMiddleLine + 1
                    );
                  } else {
                    segment2Stations = middleLineStations
                      .slice(
                        secondTransferOnMiddleLine,
                        firstTransferOnMiddleLine + 1
                      )
                      .reverse();
                  }

                  segments.push({
                    line: middleLine,
                    from: firstTransfer,
                    to: secondTransfer,
                    stations: segment2Stations,
                  });

                  // Third segment: from second transfer to destination
                  const toLineStations = metroLines[toLine].stations;
                  const secondTransferOnToLine =
                    toLineStations.indexOf(secondTransfer);
                  const toIndex = toLineStations.indexOf(toStation);

                  let segment3Stations: string[] = [];
                  if (secondTransferOnToLine < toIndex) {
                    segment3Stations = toLineStations.slice(
                      secondTransferOnToLine,
                      toIndex + 1
                    );
                  } else {
                    segment3Stations = toLineStations
                      .slice(toIndex, secondTransferOnToLine + 1)
                      .reverse();
                  }

                  segments.push({
                    line: toLine,
                    from: secondTransfer,
                    to: toStation,
                    stations: segment3Stations,
                  });

                  // Calculate total stops
                  const totalStops =
                    segment1Stations.length +
                    segment2Stations.length +
                    segment3Stations.length -
                    4;

                  possibleRoutes.push({
                    segments: segments,
                    totalStops: totalStops,
                  });
                } catch (e) {
                  // Skip this route if there's an error
                  console.error('Error building route', e);
                }
              }
            }
          }
        }
      }
    }
  }

  return possibleRoutes;
}

// Find a direct route between two stations on the same line
export function findDirectRoute(
  fromStation: string,
  toStation: string
): Route | null {
  const fromLines = findLinesForStation(fromStation);
  const toLines = findLinesForStation(toStation);

  // Check if stations are on the same line
  const commonLine = fromLines.find((line) => toLines.includes(line));

  if (commonLine) {
    const line = metroLines[commonLine];
    const fromIndex = line.stations.indexOf(fromStation);
    const toIndex = line.stations.indexOf(toStation);

    let routeStations: string[] = [];

    if (fromIndex < toIndex) {
      // Forward direction
      routeStations = line.stations.slice(fromIndex, toIndex + 1);
    } else {
      // Backward direction
      routeStations = line.stations.slice(toIndex, fromIndex + 1).reverse();
    }

    return {
      segments: [
        {
          line: commonLine,
          from: fromStation,
          to: toStation,
          stations: routeStations,
        },
      ],
      totalStops: Math.abs(toIndex - fromIndex),
    };
  }

  return null;
}

// Find the best route between two stations
export function findBestRoute(
  fromStation: string,
  toStation: string
): Route | null {
  // Check for direct route first
  const directRoute = findDirectRoute(fromStation, toStation);
  if (directRoute) {
    return directRoute;
  }

  // Find transfer routes
  const transferRoutes = findTransferRoutes(fromStation, toStation);

  if (transferRoutes.length > 0) {
    // Sort transfer routes by number of transfers and total stops
    transferRoutes.sort((a, b) => {
      // Sort by number of transfers first
      if (a.segments.length !== b.segments.length) {
        return a.segments.length - b.segments.length;
      }
      // Then by total stops
      return a.totalStops - b.totalStops;
    });

    return transferRoutes[0];
  }

  return null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestStation(location: Coordinates): string {
  let nearestStation = '';
  let shortestDistance = Infinity;

  for (const lineKey in metroLines) {
    const line = metroLines[lineKey];
    for (const station of line.stations) {
      // You'll need to add station coordinates to your metro-data
      const distance = calculateDistance(location, stationCoordinates[station]);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestStation = station;
      }
    }
  }

  return nearestStation;
}
