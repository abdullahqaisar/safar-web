import React from 'react';
import { TransitLine } from '@/core/types/graph';
import LineSelector from './StationInfo/LineSelector';

interface MapSidebarProps {
  metroLines: TransitLine[];
  selectedLineId: string | null;
  visibleLines: string[];
  onSelectLine: (lineId: string) => void;
  onToggleLineVisibility: (lineId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const MapSidebar: React.FC<MapSidebarProps> = ({
  metroLines,
  selectedLineId,
  visibleLines,
  onSelectLine,
  onToggleLineVisibility,
  onShowAll,
  onHideAll,
}) => {
  return (
    <div className="space-y-4">
      <LineSelector
        lines={metroLines}
        selectedLine={selectedLineId}
        visibleLines={visibleLines}
        onLineSelect={onSelectLine}
        onToggleLineVisibility={onToggleLineVisibility}
        onShowAll={onShowAll}
        onHideAll={onHideAll}
      />
    </div>
  );
};

export default MapSidebar;
