import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { getStationCoordinates } from '../../utils/station-helpers';

interface ViewControllerProps {
  selectedLine?: string;
  metroLines: Array<{
    id: string;
    name: string;
    stations: string[];
    color?: string;
  }>;
}

/**
 * Controller component for map view management
 */
const ViewController = ({ selectedLine, metroLines }: ViewControllerProps) => {
  const map = useMap();
  const lastSelectedLineRef = useRef<string | undefined>(selectedLine);

  // Initial size correction when component mounts
  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  // Handle view changes when selection changes
  useEffect(() => {
    // Skip if selection hasn't changed
    if (selectedLine === lastSelectedLineRef.current) {
      return;
    }

    // Update the ref to track the current selection
    lastSelectedLineRef.current = selectedLine;

    if (selectedLine) {
      // Fit view to show the selected line
      const selectedLineData = metroLines.find(
        (line) => line.id === selectedLine
      );

      if (selectedLineData?.stations.length) {
        const coordinates = selectedLineData.stations.map(
          getStationCoordinates
        );

        // Calculate center point of all stations
        const totalLat = coordinates.reduce((sum, coord) => sum + coord[0], 0);
        const totalLng = coordinates.reduce((sum, coord) => sum + coord[1], 0);
        const center = [
          totalLat / coordinates.length,
          totalLng / coordinates.length,
        ] as [number, number];

        // Fly to the center with animation
        map.flyTo(center, 13, {
          animate: true,
          duration: 1,
        });
      }
    } else {
      // Reset view to default center position
      map.flyTo([33.6861871107659, 73.048283867797], 12, {
        animate: true,
        duration: 1,
      });
    }
  }, [selectedLine, metroLines, map]);

  return null;
};

export default ViewController;
