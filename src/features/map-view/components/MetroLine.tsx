import React from 'react';
import { Polyline } from 'react-leaflet';
import { getStationCoordinates } from '../../routes/utils/station-helpers';
import LineLabel from './LineLabel';

interface MetroLineProps {
  stations: string[];
  color: string;
  isFeeder?: boolean;
  lineIndex?: number;
  totalLines?: number;
  zoomLevel: number;
  lineName?: string; // Add line name for the label
  lineId?: string; // Add line ID for keying purposes
  isSelectedLine?: boolean; // Indicates if this is currently selected
}

const MetroLine: React.FC<MetroLineProps> = ({
  stations,
  color,
  isFeeder = false,
  lineIndex = 0,
  totalLines = 1,
  zoomLevel,
  lineName = '',
  lineId = '',
  isSelectedLine = false,
}) => {
  // Build line coordinates
  const stationCoords = stations.map(getStationCoordinates);

  // Calculate offset for parallel lines at intersections
  const getLineOptions = () => {
    // Base options
    const options = {
      color: color,
      weight: isFeeder ? 3 : zoomLevel >= 14 ? 6 : 5, // Adjust line thickness based on zoom level
      opacity: isFeeder ? 0.7 : 0.85, // Slightly more transparent for feeder routes
    };

    // Only apply offsets when we have multiple lines (otherwise center the line)
    if (totalLines > 1) {
      // Calculate how far to offset the line (in pixels)
      // For 2 lines: -1 and 1 pixels
      // For 3 lines: -2, 0, and 2 pixels
      // etc.
      const maxOffset = Math.floor(totalLines / 2) * 2;
      const offset = lineIndex - (totalLines - 1) / 2;
      const normalizedOffset =
        (offset / ((totalLines - 1) / 2)) * (maxOffset / 2);

      // Add offset to options
      return {
        ...options,
        offset: normalizedOffset,
        smoothFactor: 1,
      };
    }

    return options;
  };

  // Calculate label position and rotation
  const calculateLabelPosition = () => {
    // Only calculate if we have enough coordinates and a name
    if (stationCoords.length < 2 || !lineName) {
      return null;
    }

    // Find the longest segment for better label placement
    let maxLength = 0;
    let bestSegment = 0;

    for (let i = 0; i < stationCoords.length - 1; i++) {
      const dx = stationCoords[i + 1][0] - stationCoords[i][0];
      const dy = stationCoords[i + 1][1] - stationCoords[i][1];
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > maxLength) {
        maxLength = length;
        bestSegment = i;
      }
    }

    // Prefer segments closer to the middle for aesthetic purposes
    const middleIndex = Math.floor(stationCoords.length / 2);
    const candidateSegments = [];

    // Consider segments that are at least 70% as long as the longest segment
    for (let i = 0; i < stationCoords.length - 1; i++) {
      const dx = stationCoords[i + 1][0] - stationCoords[i][0];
      const dy = stationCoords[i + 1][1] - stationCoords[i][1];
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length >= maxLength * 0.7) {
        candidateSegments.push({
          index: i,
          length: length,
          distanceFromMiddle: Math.abs(i - middleIndex),
        });
      }
    }

    // Sort by distance from middle (ascending) if we have candidates
    if (candidateSegments.length > 0) {
      candidateSegments.sort(
        (a, b) => a.distanceFromMiddle - b.distanceFromMiddle
      );
      bestSegment = candidateSegments[0].index;
    }

    // Get the start and end coordinates of the chosen segment
    const startCoord = stationCoords[bestSegment];
    const endCoord = stationCoords[bestSegment + 1];

    // Calculate position at the middle of the segment
    const position: [number, number] = [
      (startCoord[0] + endCoord[0]) / 2,
      (startCoord[1] + endCoord[1]) / 2,
    ];

    // Calculate rotation angle based on segment direction
    const dx = endCoord[1] - startCoord[1];
    const dy = endCoord[0] - startCoord[0];

    // Calculate angle in degrees, adjusting for leaflet's coordinate system
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);

    // Normalize the angle to ensure the label is always readable
    // Keep text either horizontal or upside down (easier to read)
    if (angle > 90 || angle < -90) {
      angle += 180; // Flip the label if it would be upside down
    }

    return { position, angle };
  };

  // Calculate label data
  const labelData = calculateLabelPosition();

  // Show labels only at higher zoom levels
  const shouldShowLabel = zoomLevel >= 13 && labelData && lineName;

  return (
    <>
      <Polyline positions={stationCoords} {...getLineOptions()} />

      {shouldShowLabel && labelData && (
        <LineLabel
          position={labelData.position}
          rotation={labelData.angle}
          color={color}
          text={lineName}
          isHighlighted={isSelectedLine}
          shouldFade={false}
        />
      )}
    </>
  );
};

export default MetroLine;
