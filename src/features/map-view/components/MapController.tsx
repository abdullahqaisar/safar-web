import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet'; // Import Leaflet
import { getStationCoordinates } from '../../routes/utils/station-helpers';

interface MapControllerProps {
  selectedLine?: string;
  metroLines: Array<{
    id: string;
    name: string;
    stations: string[];
    color?: string;
  }>;
}

const MapController: React.FC<MapControllerProps> = ({
  selectedLine,
  metroLines,
}) => {
  const map = useMap();

  // Force resize when component mounts
  useEffect(() => {
    if (map) {
      // Force map to recalculate size - helps with tile display issues
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map]);

  // Handle view changes based on selection
  useEffect(() => {
    if (!map) return; // Guard against undefined map

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

          // Create a bounds object - FIX: Start with empty bounds instead of current map bounds
          // This prevents the progressive zooming out with each line selection
          const bounds =
            coordinates.length > 0
              ? coordinates.reduce(
                  (bounds, coord) => bounds.extend(coord),
                  L.latLngBounds([]) // Empty bounds as starting point
                )
              : null;

          // Only call fitBounds if we have valid bounds
          if (bounds && bounds.isValid()) {
            // Add reasonable padding to make all stations visible
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } else {
        // Reset view to show all lines
        map.setView([33.6861871107659, 73.048283867797], 12);
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
