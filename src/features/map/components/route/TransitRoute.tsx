import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { PathOptions } from 'leaflet';
import { getStationCoordinates } from '../../utils/station-helpers';
import { calculateLineOffset } from '../../utils/parallelLineHelper';
import LineLabel from './LineLabel';

interface TransitRouteProps {
  stations: string[];
  color: string;
  isFeeder?: boolean;
  zoomLevel: number;
  lineName?: string;
  isSelectedLine?: boolean;
  lineId?: string;
  parallelLineGroups?: Record<string, string[]>;
}

const TransitRoute: React.FC<TransitRouteProps> = ({
  stations,
  color,
  isFeeder = false,
  zoomLevel,
  lineName = '',
  isSelectedLine = false,
  lineId = '',
  parallelLineGroups = {},
}) => {
  // Get regular station coordinates
  const baseStationCoords = useMemo(
    () => stations.map(getStationCoordinates),
    [stations]
  );

  // Calculate offset based on parallel group information
  const parallelOffset = useMemo(() => {
    if (lineId && Object.keys(parallelLineGroups).length > 0) {
      return calculateLineOffset(lineId, parallelLineGroups, zoomLevel);
    }
    return 0;
  }, [lineId, parallelLineGroups, zoomLevel]);

  // Apply offset to create parallel lines visually
  const stationCoords = useMemo(() => {
    if (!parallelOffset) return baseStationCoords;

    // For significant offsets, physically displace the line
    return baseStationCoords.map((coord) => {
      // Find perpendicular displacement
      // We need to look ahead and behind to determine direction
      const index = baseStationCoords.indexOf(coord);

      // Skip if it's the first or last point (no direction)
      if (index <= 0 || index >= baseStationCoords.length - 1) {
        return coord;
      }

      // Get adjacent points
      const prev = baseStationCoords[index - 1];
      const next = baseStationCoords[index + 1];

      // Calculate direction vector
      const dx1 = coord[1] - prev[1]; // Note: [lat, lng] so dx/dy are swapped
      const dy1 = coord[0] - prev[0];
      const dx2 = next[1] - coord[1];
      const dy2 = next[0] - coord[0];

      // Average the directions
      const dx = (dx1 + dx2) / 2;
      const dy = (dy1 + dy2) / 2;

      // Normalize to unit length
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) return coord;

      const unitX = dx / length;
      const unitY = dy / length;

      // Perpendicular vector (90 degrees rotation)
      const perpX = -unitY;
      const perpY = unitX;

      // Apply offset (meters to degrees rough conversion - will vary by latitude)
      // ~111,111 meters per degree of latitude
      const offsetFactor = 0.000005 * parallelOffset; // Adjust this value for desired spacing

      return [
        coord[0] + perpY * offsetFactor,
        coord[1] + perpX * offsetFactor,
      ] as [number, number];
    });
  }, [baseStationCoords, parallelOffset]);

  // Line styling with improved appearance - with brighter teal color
  const lineOptions = useMemo((): PathOptions => {
    // Weight (thickness) based on line type and zoom
    const weight = isFeeder
      ? zoomLevel >= 14
        ? 3
        : 2.5 // Thinner for feeder routes
      : zoomLevel >= 14
      ? 5
      : 4; // Thicker for main routes

    // Higher opacity for selected lines
    const opacity = isSelectedLine ? 1 : isFeeder ? 0.85 : 0.9;

    // Use a light teal color (#4FD1C5) for feeder lines
    // This is a more accessible teal that follows best practices for readability
    const feederColor = '#4FD1C5'; // Light teal color for feeder routes
    const lineColor = isFeeder ? feederColor : color;

    // Use dotted line for feeder routes
    const dashArray = isFeeder ? '5, 8' : undefined;

    return {
      color: lineColor,
      weight,
      opacity,
      dashArray,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    };
  }, [color, isFeeder, isSelectedLine, zoomLevel]);

  // Calculate label position with offset
  const labelData = useMemo(() => {
    if (stationCoords.length < 2 || !lineName) return null;

    const middleIndex = Math.floor((stationCoords.length - 1) / 2);
    const startCoord = stationCoords[middleIndex];
    const endCoord = stationCoords[middleIndex + 1];

    if (!startCoord || !endCoord) return null;

    // Position in the middle of the segment
    const position: [number, number] = [
      (startCoord[0] + endCoord[0]) / 2,
      (startCoord[1] + endCoord[1]) / 2,
    ];

    // Calculate rotation angle
    const dx = endCoord[1] - startCoord[1];
    const dy = endCoord[0] - startCoord[0];
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);

    // Make text readable
    if (angle > 90 || angle < -90) {
      angle += 180;
    }

    return { position, angle };
  }, [stationCoords, lineName]);

  const shouldShowLabel = zoomLevel >= 13 && labelData && lineName;

  return (
    <>
      <Polyline positions={stationCoords} pathOptions={lineOptions} />

      {shouldShowLabel && labelData && (
        <LineLabel
          position={labelData.position}
          rotation={labelData.angle}
          color={isFeeder ? '#4FD1C5' : color}
          text={lineName}
          isHighlighted={isSelectedLine}
          shouldFade={false}
          isFeeder={isFeeder}
        />
      )}
    </>
  );
};

// More aggressive memoization to prevent unnecessary recalculations
const MemoizedTransitRoute = React.memo(
  TransitRoute,
  (prevProps, nextProps) => {
    // Only re-render if anything relevant changes
    return (
      prevProps.stations.join() === nextProps.stations.join() &&
      prevProps.color === nextProps.color &&
      prevProps.isFeeder === nextProps.isFeeder &&
      prevProps.zoomLevel === nextProps.zoomLevel &&
      prevProps.isSelectedLine === nextProps.isSelectedLine &&
      prevProps.lineId === nextProps.lineId
      // We intentionally don't compare parallelLineGroups since it's an object
      // and would cause unnecessary re-renders even when the content is the same
    );
  }
);

export default MemoizedTransitRoute;
