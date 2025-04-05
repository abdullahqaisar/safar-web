import React from 'react';
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

function StationMarkerList({
  stations,
  selectedStation,
  onStationSelect,
  zoomLevel,
  getLineName,
}: StationMarkerListProps) {
  // Filter stations based on zoom level for performance
  let visibleStations = stations;

  // At very low zoom levels, only show transfer stations
  if (zoomLevel < 10) {
    visibleStations = stations.filter((station) => station.lines.length > 1);
  }
  // At medium zoom, show transfers and a subset of regular stations
  else if (zoomLevel < 12 && stations.length > 100) {
    visibleStations = stations.filter(
      (station, index) =>
        station.stationId === selectedStation ||
        station.lines.length > 1 ||
        index % 2 === 0 // Show every other station
    );
  }

  return (
    <>
      {visibleStations.map((station) => (
        <StationMarker
          key={station.stationId}
          stationId={station.stationId}
          lines={station.lines.map((line) => ({
            ...line,
            name: line.name || getLineName(line.id),
          }))}
          selectedStation={selectedStation}
          onStationSelect={onStationSelect}
        />
      ))}
    </>
  );
}

export default StationMarkerList;
