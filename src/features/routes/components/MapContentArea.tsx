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
  showInfoPanel: boolean;
  toggleFullscreen: () => void;
  toggleFiltersPanel: () => void;
  mapContainerRef?: React.RefObject<HTMLDivElement>;
  onStationSelect: (stationId: string | null) => void;
  selectedStation: string | null;
  onResetFilters?: () => void;
}

const MapContentArea: React.FC<MapContentAreaProps> = ({
  filteredLines,
  selectedLineId,
  selectedLineData,
  isFullscreen,
  showInfoPanel,
  toggleFullscreen,
  toggleFiltersPanel,
  mapContainerRef,
  onStationSelect,
  selectedStation,
  onResetFilters,
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
          toggleFullscreen={toggleFullscreen}
          toggleFiltersPanel={toggleFiltersPanel}
          onResetFilters={onResetFilters}
        />
      </div>

      {/* Line/Station Information Card - Always show it, with or without selected line */}
      {(showInfoPanel || isMobile) && (
        <div className="bg-white rounded-xl shadow-sm">
          <LineDetails
            selectedLineData={selectedLineData || undefined}
            schedule={schedule}
            onStationSelect={onStationSelect}
            onClearSelection={() => onStationSelect(null)}
          />
        </div>
      )}
    </div>
  );
};

export default MapContentArea;
