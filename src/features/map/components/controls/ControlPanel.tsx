import React from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface ControlPanelProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  toggleFiltersPanel?: () => void;
  showMobileControls?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCenterMap?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isFullscreen,
  toggleFullscreen,
  showMobileControls = false,
  onZoomIn = () => {},
  onZoomOut = () => {},
  onCenterMap = () => {},
}) => {
  // Common button styles for consistency
  const buttonClass =
    'bg-white shadow-md border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50';

  if (showMobileControls) {
    // Mobile controls as a bottom bar
    return (
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10 flex items-center bg-white/95 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-md border border-gray-200">
        {/* Zoom Out */}
        <button
          className={`${buttonClass} h-9 w-9 mr-1`}
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4 text-gray-700" />
        </button>

        {/* Zoom In */}
        <button
          className={`${buttonClass} h-9 w-9 mr-1`}
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4 text-gray-700" />
        </button>

        {/* Fullscreen Button */}
        <button
          className={`${buttonClass} h-9 w-9`}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-gray-700" />
          ) : (
            <Maximize2 className="h-4 w-4 text-gray-700" />
          )}
        </button>
      </div>
    );
  }

  // Desktop controls
  return (
    <div
      className="absolute right-4 top-4 z-10 flex flex-col gap-2"
      role="group"
      aria-label="Map controls"
    >
      {/* Fullscreen Button */}
      <button
        className={`${buttonClass} h-10 w-10`}
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="h-5 w-5 text-gray-700" />
        ) : (
          <Maximize2 className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* Zoom Controls */}
      <button
        className={`${buttonClass} h-10 w-10`}
        onClick={onZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-5 w-5 text-gray-700" />
      </button>

      <button
        className={`${buttonClass} h-10 w-10`}
        onClick={onZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-5 w-5 text-gray-700" />
      </button>

      {/* Locate/Reset View Button */}
      <button
        className={`${buttonClass} h-10 w-10`}
        onClick={onCenterMap}
        title="Reset view"
        aria-label="Center map"
      >
        <Locate className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
};

export default ControlPanel;
