import React from 'react';
import { TransitLine } from '@/core/types/graph';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatScheduleTimes } from '../../utils/station-helpers';
import MapContainer from '../core/MapContainer';
import LineDetails from '../route/LineDetails';

interface MapContentAreaProps {
  filteredLines: TransitLine[];
  selectedLineId: string | null;
  selectedLineData: TransitLine | null;
  isFullscreen: boolean;
  showInfoPanel: boolean;
  toggleFullscreen: () => void;
  mapContainerRef?: React.RefObject<HTMLDivElement>;
  onStationSelect: (stationId: string | null) => void;
  selectedStation: string | null;
}

const MapContentArea: React.FC<MapContentAreaProps> = ({
  filteredLines,
  selectedLineId,
  selectedLineData,
  isFullscreen,
  showInfoPanel,
  toggleFullscreen,
  mapContainerRef,
  onStationSelect,
  selectedStation,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Format schedule data
  const schedule = selectedLineData?.schedule
    ? formatScheduleTimes(selectedLineData.schedule)
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-6">
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
        />
      </div>

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
