import React from 'react';
import { RotateCcw, ZoomIn } from 'lucide-react';

interface MapControlsProps {
  zoomLevel: number;
  isSelectionActive: boolean;
  onReset: () => void;
  onZoomToDetails: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  zoomLevel,
  isSelectionActive,
  onReset,
  onZoomToDetails,
}) => {
  return (
    <div className="map-controls flex flex-col gap-2">
      {/* Keyboard controls help */}
      <div className="bg-white/90 p-1.5 rounded-md shadow-md border border-gray-100 text-xs flex items-center gap-1.5">
        <kbd className="px-1 py-0.5 border border-gray-300 rounded bg-gray-50">
          ↑↓←→
        </kbd>
        <span className="text-gray-700 mr-1">Pan</span>
        <kbd className="px-1 py-0.5 border border-gray-300 rounded bg-gray-50">
          +/-
        </kbd>
        <span className="text-gray-700">Zoom</span>
      </div>

      {/* Show zoom hint button when zoomed out */}
      {zoomLevel < 12 && (
        <button
          className="bg-white rounded-md shadow-md px-3 py-2 flex items-center gap-2 w-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-[rgba(var(--color-accent-rgb),0.2)]"
          onClick={onZoomToDetails}
          aria-label="Zoom in for more details"
          title="Zoom in to see station details"
        >
          <ZoomIn size={14} className="text-[color:var(--color-accent)]" />
          <span className="whitespace-nowrap">Zoom for details</span>
        </button>
      )}

      {/* Show reset view button when something is selected */}
      {isSelectionActive && (
        <button
          className="bg-white rounded-md shadow-md px-3 py-2 flex items-center gap-2 w-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-[rgba(var(--color-accent-rgb),0.2)]"
          onClick={onReset}
          aria-label="Reset map view"
          title="Reset to default view"
        >
          <RotateCcw size={14} className="text-[color:var(--color-accent)]" />
          <span>Reset View</span>
        </button>
      )}
    </div>
  );
};

export default MapControls;
