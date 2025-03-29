import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
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

const MapController = ({ selectedLine, metroLines }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      // Force map to recalculate size - helps with tile display issues
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map]);

  useEffect(() => {
    if (selectedLine) {
      // Fit bounds to show the entire selected line
      const selectedLineData = metroLines.find(
        (line) => line.id === selectedLine
      );
      if (selectedLineData && selectedLineData.stations.length) {
        const bounds = selectedLineData.stations.map((stationId) =>
          getStationCoordinates(stationId)
        );
        map.fitBounds(bounds as L.LatLngBoundsExpression, {
          padding: [50, 50],
        });
      }
    } else {
      // Reset view to show all lines - center on Kashmir Highway which is central
      map.setView([33.6861871107659, 73.048283867797], 12);
    }
  }, [selectedLine, metroLines, map]);

  return null;
};

export default MapController;
