import React, { memo, useMemo } from 'react';
import StationMarker from './StationMarker';

// Updated interface to match the one from map-helpers
interface StationData {
  stationId: string;
  lines: Array<{ id: string; color?: string; name?: string }>;
}

interface StationMarkerListProps {
  stations: StationData[];
  selectedStation: string | null;
  onStationSelect: (stationId: string | null) => void;
  zoomLevel: number;
  getLineName: (lineId: string) => string;
}

// Memoized component to render station markers with windowing optimization
const StationMarkerList = memo(
  function StationMarkerList({
    stations,
    selectedStation,
    onStationSelect,
    zoomLevel,
    getLineName,
  }: StationMarkerListProps) {
    // Apply windowing optimization based on zoom level
    const visibleStations = useMemo(() => {
      // At very low zoom levels, prioritize important stations
      if (zoomLevel < 10) {
        // Show only transfer stations (multi-line stations) at very low zoom
        return stations.filter((station) => station.lines.length > 1);
      }

      // At medium zoom, use a sampling strategy for dense areas
      if (zoomLevel < 12 && stations.length > 100) {
        // Show every Nth station, but always include selected station and transfers
        return stations.filter(
          (station, index) =>
            station.stationId === selectedStation ||
            station.lines.length > 1 ||
            index % 2 === 0 // Show every other station
        );
      }

      // At higher zoom levels, show all stations
      return stations;
    }, [stations, zoomLevel, selectedStation]);

    return (
      <>
        {visibleStations.map((station) => (
          <StationMarker
            key={station.stationId}
            stationId={station.stationId}
            lines={station.lines.map((line) => ({
              ...line,
              name: line.name || getLineName(line.id), // Use existing name or get it from the function
            }))}
            selectedStation={selectedStation}
            onStationSelect={onStationSelect}
          />
        ))}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Optimize re-renders by checking if props have meaningfully changed
    return (
      prevProps.zoomLevel === nextProps.zoomLevel &&
      prevProps.selectedStation === nextProps.selectedStation &&
      prevProps.stations === nextProps.stations
    );
  }
);

export default StationMarkerList;
