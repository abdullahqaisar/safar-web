import React from 'react';
import { TransitLine } from '@/core/types/graph';
import { useMediaQuery } from '@/hooks/use-media-query';
import MapContainer from '../../map-view/MapContainer';
import LineDetails from './StationInfo/LineDetails';
import { formatScheduleTimes } from '../utils/station-helpers';

interface MapContentAreaProps {
  filteredLines: TransitLine[];
  selectedLineId: string | null;
  selectedLineData: TransitLine | null;
  isFullscreen: boolean;
  showStations: boolean;
  showFiltersPanel: boolean;
  showInfoPanel: boolean;
  toggleFullscreen: () => void;
  toggleStations: () => void;
  toggleFiltersPanel: () => void;
  mapContainerRef?: React.RefObject<HTMLDivElement>;
  onStationSelect: (stationId: string | null) => void;
  selectedStation: string | null;
}

const MapContentArea: React.FC<MapContentAreaProps> = ({
  filteredLines,
  selectedLineId,
  selectedLineData,
  isFullscreen,
  showStations,
  showInfoPanel,
  toggleFullscreen,
  toggleStations,
  toggleFiltersPanel,
  mapContainerRef,
  onStationSelect,
  selectedStation,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Format schedule data properly for LineDetails
  const schedule = selectedLineData?.schedule
    ? formatScheduleTimes(selectedLineData.schedule)
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="rounded-xl overflow-hidden bg-white shadow-sm"
      >
        <MapContainer
          metroLines={filteredLines}
          selectedLine={selectedLineId || undefined}
          selectedStation={selectedStation}
          onStationSelect={onStationSelect}
          isFullscreen={isFullscreen}
          showStations={showStations}
          toggleFullscreen={toggleFullscreen}
          toggleStations={toggleStations}
          toggleFiltersPanel={toggleFiltersPanel}
        />
      </div>

      {/* Line/Station Information Card */}
      {selectedLineData && (showInfoPanel || isMobile) && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <LineDetails
            selectedLineData={selectedLineData}
            schedule={schedule}
            onStationSelect={onStationSelect}
            onClearSelection={() => {}} // This is needed for the LineDetails component
          />
        </div>
      )}
    </div>
  );
};

export default MapContentArea;
