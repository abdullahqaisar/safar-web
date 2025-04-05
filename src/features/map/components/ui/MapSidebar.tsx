import React from 'react';
import { TransitLine } from '@/core/types/graph';
import LineSelector from '../route/LineSelector';

interface MapSidebarProps {
  metroLines: TransitLine[];
  selectedLineId: string | null;
  visibleLines: string[];
  onSelectLine: (lineId: string) => void;
  onToggleLineVisibility: (lineId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const MapSidebar = ({
  metroLines,
  selectedLineId,
  visibleLines,
  onSelectLine,
  onToggleLineVisibility,
  onShowAll,
  onHideAll,
}: MapSidebarProps) => (
  <LineSelector
    lines={metroLines}
    selectedLine={selectedLineId}
    visibleLines={visibleLines}
    onLineSelect={onSelectLine}
    onToggleLineVisibility={onToggleLineVisibility}
    onShowAll={onShowAll}
    onHideAll={onHideAll}
  />
);

export default MapSidebar;
