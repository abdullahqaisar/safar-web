import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet'; // Import Leaflet
import { getStationCoordinates } from '../../utils/station-helpers';

interface MapControllerProps {
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
 * Handles map view changes based on selections without causing unnecessary re-renders
 */
const MapController: React.FC<MapControllerProps> = ({
  selectedLine,
  metroLines,
}) => {
  const map = useMap();
  const lastSelectedLineRef = useRef<string | undefined>(selectedLine);

  // Force resize when component mounts - only once
  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  // Handle view changes based on selection - only when selection changes
  useEffect(() => {
    // Skip if selection hasn't changed
    if (selectedLine === lastSelectedLineRef.current) {
      return;
    }

    // Update the ref to track the current selection
    lastSelectedLineRef.current = selectedLine;

    try {
      if (selectedLine) {
        // Fit bounds to show the entire selected line
        const selectedLineData = metroLines.find(
          (line) => line.id === selectedLine
        );

        if (selectedLineData && selectedLineData.stations.length) {
          const coordinates = selectedLineData.stations.map((stationId) =>
            getStationCoordinates(stationId)
          );

          // Create a bounds object - empty bounds as starting point prevents progressive zooming out
          const bounds =
            coordinates.length > 0
              ? coordinates.reduce(
                  (bounds, coord) => bounds.extend(coord),
                  L.latLngBounds([])
                )
              : null;

          // Only call fitBounds if we have valid bounds
          if (bounds && bounds.isValid()) {
            // Add reasonable padding to make all stations visible
            map.flyTo(bounds.getCenter(), 13, {
              animate: true,
              duration: 1,
            });
          }
        }
      } else {
        // Reset view to show all lines
        map.flyTo([33.6861871107659, 73.048283867797], 12, {
          animate: true,
          duration: 1,
        });
      }
    } catch (error) {
      console.error('Error adjusting map view:', error);
      // Fallback to a safe default
      map.setView([33.6861871107659, 73.048283867797], 12);
    }
  }, [selectedLine, metroLines, map]);

  return null;
};

export default MapController;
