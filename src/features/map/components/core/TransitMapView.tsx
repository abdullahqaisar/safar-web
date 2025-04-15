'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  AttributionControl,
  MapContainerProps,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import 'leaflet-gesture-handling';
import { getStationCoordinates } from '../../utils/station-helpers';
import {
  groupStationsByIds,
  isFeederLine,
  organizeLinesToDraw,
} from '../../utils/map-helpers';
import { buildParallelLineGroups } from '../../utils/parallelLineHelper';

// Import all the extracted components
import ViewController from '../controls/ViewController';
import ResizeHandler from '../controls/ResizeHandler';
import TileLoadTracker from './TileLoadTracker';
import ZoomListener from '../controls/ZoomListener';
import TransitRoute from '../route/TransitRoute';
import { RotateCcw, ZoomIn } from 'lucide-react';
import StationMarkerList from '../stations/StationMarkerList';
import { useMediaQuery } from '@/hooks/use-media-query';

// Extend MapContainer props with gesture handling options
interface ExtendedMapContainerProps extends MapContainerProps {
  gestureHandling?: boolean;
  gestureHandlingOptions?: {
    text?: {
      touch?: string;
      scroll?: string;
      scrollMac?: string;
    };
    duration?: number;
  };
}

// Add clean, minimalist CSS for touch interactions
const mapInteractionStyles = `
  /* Gesture hint styles */
  .gesture-hint {
    position: absolute;
    top: 10px;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: fit-content;
    max-width: 90%;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 11px;
    color: #555;
    z-index: 1000;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    white-space: nowrap;
    text-align: center;
    pointer-events: none;
    opacity: 0;
    transform: translateY(-5px);
    animation: fadeIn 0.3s forwards;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .gesture-hint.hide {
    animation: fadeOut 0.3s forwards;
  }
  
  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateY(-5px);
    }
  }
  
  /* Override Leaflet gesture handling text */
  .leaflet-gesture-handling-touch-warning,
  .leaflet-gesture-handling-scroll-warning {
    display: none !important;
  }
  
  /* Improve touch feedback */
  .transit-map-leaflet .leaflet-interactive {
    cursor: pointer;
  }
  
  /* Smoother touch interactions */
  .transit-map-container {
    -webkit-tap-highlight-color: transparent;
  }
  
  .transit-map-leaflet.interacting {
    cursor: grabbing;
  }
`;

const DefaultIcon = L.icon({
  iconUrl: '/images/icons/marker-icon.png',
  shadowUrl: '/images/icons/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TransitMapViewProps {
  metroLines: Array<{
    id: string;
    name: string;
    stations: string[];
    color?: string;
  }>;
  selectedLine?: string;
  className?: string;
  selectedStation?: string | null;
  onStationSelect?: (stationId: string | null) => void;
  onMapReady?: () => void;
  onMapInstance?: (map: L.Map) => void;
}

// Gesture Hint Component with clean design
const GestureHint: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Show for 5 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div className={`gesture-hint ${visible ? '' : 'hide'}`}>
      Use two fingers to navigate the map
    </div>
  );
};

const ControlPanel: React.FC<{
  zoomLevel: number;
  isSelectionActive: boolean;
  onReset: () => void;
  onZoomToDetails: () => void;
  onResetFilters?: () => void;
}> = ({
  zoomLevel,
  isSelectionActive,
  onReset,
  onZoomToDetails,
  onResetFilters,
}) => {
  const handleFullReset = () => {
    onReset();
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <div className="absolute top-3 left-3 z-[999] flex flex-col gap-2 min-w-[150px]">
      {zoomLevel < 12 && (
        <button
          className="bg-white rounded-md shadow-md px-3 py-2 flex items-center gap-2 w-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-[rgba(var(--color-accent-rgb),0.2)]"
          onClick={onZoomToDetails}
          aria-label="Zoom in for more details"
        >
          <ZoomIn size={14} className="text-emerald-500" />
          <span>Zoom for details</span>
        </button>
      )}

      {isSelectionActive && (
        <button
          className="bg-white rounded-md shadow-md px-3 py-2 flex items-center gap-2 w-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-[rgba(var(--color-accent-rgb),0.2)]"
          onClick={handleFullReset}
          aria-label="Reset map view and filters"
        >
          <RotateCcw size={14} className="text-emerald-500" />
          <span>Reset View</span>
        </button>
      )}
    </div>
  );
};

const TransitMapView: React.FC<
  TransitMapViewProps & {
    onResetFilters?: () => void;
  }
> = ({
  metroLines,
  selectedLine,
  className = 'h-[600px]',
  selectedStation = null,
  onStationSelect = () => {},
  onMapReady = () => {},
  onMapInstance = () => {},
  onResetFilters,
}) => {
  const [zoomLevel, setZoomLevel] = useState(12);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const hasInitializedRef = useRef(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inject CSS styles for mobile map manipulation
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = mapInteractionStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Show gesture hint after a short delay when map is ready on mobile
  useEffect(() => {
    if (isMobile && tilesLoaded) {
      const timer = setTimeout(() => {
        setShowGestureHint(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isMobile, tilesLoaded]);

  // Handle map interaction state
  useEffect(() => {
    const handleMapInteractionStart = () => {
      setIsInteracting(true);

      if (interactingTimeoutRef.current) {
        clearTimeout(interactingTimeoutRef.current);
      }
    };

    const handleMapInteractionEnd = () => {
      interactingTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 500);
    };

    if (mapRef.current) {
      mapRef.current.on('movestart', handleMapInteractionStart);
      mapRef.current.on('zoomstart', handleMapInteractionStart);
      mapRef.current.on('moveend', handleMapInteractionEnd);
      mapRef.current.on('zoomend', handleMapInteractionEnd);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('movestart', handleMapInteractionStart);
        mapRef.current.off('zoomstart', handleMapInteractionStart);
        mapRef.current.off('moveend', handleMapInteractionEnd);
        mapRef.current.off('zoomend', handleMapInteractionEnd);
      }

      if (interactingTimeoutRef.current) {
        clearTimeout(interactingTimeoutRef.current);
      }
    };
  }, []);

  // Notify parent about map ready state - only once when both map and tiles are loaded
  useEffect(() => {
    if (tilesLoaded && mapRef.current && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      onMapReady();
    }
  }, [tilesLoaded, onMapReady]);

  // Force map refresh when window loads fully
  useEffect(() => {
    const handleLoad = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    // Handle window.load event
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Handle tiles loaded
  const handleTilesLoaded = useCallback(() => {
    setTilesLoaded(true);
  }, []);

  // Handle map initialization
  const handleMapReady = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, []);

  // Reset the view
  const handleReset = useCallback(() => {
    if (onStationSelect) {
      onStationSelect(null);
    }
    if (mapRef.current) {
      mapRef.current.setView([33.6861871107659, 73.048283867797], 12);
    }
  }, [onStationSelect]);

  // Handle zoom change
  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  // Get map center based on selection
  const getMapCenter = useCallback((): [number, number] => {
    const defaultCenter: [number, number] = [33.6861871107659, 73.048283867797];

    if (selectedStation) {
      return getStationCoordinates(selectedStation);
    }

    if (selectedLine) {
      const line = metroLines.find((l) => l.id === selectedLine);
      if (line && line.stations.length > 0) {
        const coords = line.stations.map(getStationCoordinates);
        const totalLat = coords.reduce((sum, coord) => sum + coord[0], 0);
        const totalLng = coords.reduce((sum, coord) => sum + coord[1], 0);
        return [totalLat / coords.length, totalLng / coords.length];
      }
    }

    return defaultCenter;
  }, [selectedStation, selectedLine, metroLines]);

  // Zoom to details
  const handleZoomToDetails = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(getMapCenter(), Math.min(14, zoomLevel + 2), {
        duration: 1.2,
        animate: true,
      });
    }
  }, [getMapCenter, zoomLevel]);

  // Prepare data for rendering
  const linesToDraw = organizeLinesToDraw(metroLines, selectedLine);
  const stationsToDisplay = groupStationsByIds(linesToDraw);
  const parallelLineGroups = buildParallelLineGroups(metroLines);

  // Get line name lookup
  const getLineName = (lineId: string): string => {
    const line = metroLines.find((l) => l.id === lineId);
    return line ? line.name : lineId;
  };

  // Handle station selection
  const handleStationSelect = (stationId: string | null) => {
    onStationSelect(stationId);
    if (stationId && mapRef.current) {
      const coordinates = getStationCoordinates(stationId);
      mapRef.current.panTo(coordinates, { animate: true });
    }
  };

  return (
    <div
      className={`transit-map-container ${className} relative`}
      style={{ minHeight: '400px', position: 'relative' }}
      ref={mapContainerRef}
      tabIndex={0}
      aria-label="Interactive transit map"
    >
      <div className="map-container-wrapper relative">
        {/* Cast MapContainer to our extended type with gesture handling */}
        {React.createElement(
          MapContainer as React.ComponentType<ExtendedMapContainerProps>,
          {
            center: getMapCenter(),
            zoom: zoomLevel,
            className: `transit-map-leaflet ${isInteracting ? 'interacting' : ''}`,
            whenReady: handleMapReady,
            zoomControl: false,
            attributionControl: false,
            style: { height: '100%', width: '100%' },
            maxBoundsViscosity: 1.0,
            minZoom: 9,
            maxZoom: 18,
            scrollWheelZoom: true,
            touchZoom: true,
            doubleClickZoom: true,
            gestureHandling: isMobile,
            gestureHandlingOptions: {
              text: {
                touch: 'Use two fingers to move the map',
                scroll: 'Use ctrl + scroll to zoom the map',
                scrollMac: 'Use \u2318 + scroll to zoom the map',
              },
              duration: 1000,
            },
          },
          // Attribution positioned at bottom-left
          <AttributionControl
            key="attribution"
            position="bottomleft"
            prefix={false}
          />,

          <TileLayer
            key="tileLayer"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />,

          <TileLoadTracker
            key="tileTracker"
            onTilesLoaded={handleTilesLoaded}
          />,
          <ZoomListener key="zoomListener" onZoomChange={handleZoomChange} />,
          <ResizeHandler
            key="resizeHandler"
            setMapRef={(map) => {
              mapRef.current = map;
              if (map) {
                onMapInstance(map);
              }
            }}
            onMapReady={handleMapReady}
          />,
          <ViewController
            key="viewController"
            selectedLine={selectedLine}
            metroLines={metroLines}
          />,

          // Add metro lines as polylines
          ...linesToDraw.map((line) => (
            <TransitRoute
              key={line.id}
              stations={line.stations}
              color={line.color || '#4A5568'}
              isFeeder={isFeederLine(line.id)}
              zoomLevel={zoomLevel}
              lineName={getLineName(line.id)}
              isSelectedLine={selectedLine === line.id}
              lineId={line.id}
              parallelLineGroups={parallelLineGroups}
            />
          )),

          // Station markers
          <StationMarkerList
            key="stationList"
            stations={stationsToDisplay}
            selectedStation={selectedStation || null}
            onStationSelect={handleStationSelect}
            zoomLevel={zoomLevel}
            getLineName={getLineName}
          />
        )}
      </div>

      {/* Simple, clean gesture hint at the top */}
      {isMobile && (
        <GestureHint
          visible={showGestureHint}
          onClose={() => setShowGestureHint(false)}
        />
      )}

      {/* Action buttons in top-left corner */}
      <ControlPanel
        zoomLevel={zoomLevel}
        isSelectionActive={Boolean(selectedLine || selectedStation)}
        onReset={handleReset}
        onZoomToDetails={handleZoomToDetails}
        onResetFilters={onResetFilters}
      />
    </div>
  );
};

export default TransitMapView;
