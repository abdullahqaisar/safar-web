'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
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
import { Locate } from 'lucide-react';
import StationMarkerList from '../stations/StationMarkerList';
import { useMediaQuery } from '@/hooks/use-media-query';

// CSS for clean mobile UX
const mapStyles = `
  /* Gesture hint styles */
  .gesture-hint {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    color: #555;
    z-index: 900;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    white-space: nowrap;
    text-align: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    max-width: 210px;
  }
  
  .gesture-hint.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  
  /* Prevent browser zoom and improve map interaction on mobile */
  .leaflet-container {
    touch-action: none !important;
  }
  
  /* Disable map dragging by default on mobile ONLY */
  @media (max-width: 768px) {
    .leaflet-container {
      touch-action: none !important;
    }
    
    .leaflet-container.map-active {
      cursor: grab;
    }
    
    .leaflet-container.fullscreen-mode {
      touch-action: none !important;
    }
  }
  
  /* Desktop - normal map behavior */
  @media (min-width: 769px) {
    .leaflet-container {
      cursor: grab;
    }
    
    .leaflet-container:active {
      cursor: grabbing;
    }
  }
  
  /* Smoother touch interactions */
  .transit-map-container {
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Map overlay for touch control */
  .map-touch-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
  }

  /* Control panel styles - position controls in the right corner */
  .map-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 900;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  /* Desktop positioning - adjust for fullscreen button */
  @media (min-width: 769px) {
    .map-controls {
      right: 60px; /* Move right controls away from fullscreen button */
      flex-direction: row; /* Place buttons in a row for desktop */
      gap: 8px; /* Slightly larger gap for horizontal layout */
    }
  }
  
  .map-control-button {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    border: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    color: #555;
    transition: all 0.2s ease;
  }
  
  .map-control-button:hover {
    background: #f9f9f9;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  }
  
  /* Action buttons in bottom left */
  .map-action-buttons {
    position: absolute;
    bottom: 45px;
    left: 10px;
    z-index: 900;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .map-action-button {
    background: white;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    border: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    color: #555;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .map-action-button:hover {
    background: #f9f9f9;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  }
  
  .map-action-button .icon {
    color: #10b981;
  }

  /* Properly style attribution */
  .leaflet-control-attribution {
    background-color: rgba(255, 255, 255, 0.8) !important;
    padding: 0 5px !important;
    margin: 0 !important;
    font-size: 10px !important;
    border-radius: 3px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  }

  /* Don't hide any attribution links */
  .leaflet-control-attribution.leaflet-control a {
    display: inline !important;
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

// Simple gesture hint component
const GestureHint: React.FC<{
  visible: boolean;
  message: string;
}> = ({ visible, message }) => {
  return (
    <div className={`gesture-hint ${visible ? 'visible' : ''}`}>{message}</div>
  );
};

// New control panel component with better positioning
const ControlPanel: React.FC<{
  onCenterMap: () => void;
}> = ({ onCenterMap }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Only show this control panel on mobile, as desktop now uses the external one
  if (!isMobile) {
    return null;
  }

  return (
    <div className="map-controls">
      {/* Center map button - always visible on mobile */}
      <button
        className="map-control-button"
        onClick={onCenterMap}
        aria-label="Center map"
      >
        <Locate size={18} />
      </button>
    </div>
  );
};

const TransitMapView: React.FC<
  TransitMapViewProps & {
    isFullscreen?: boolean;
  }
> = ({
  metroLines,
  selectedLine,
  className = 'h-[600px]',
  selectedStation = null,
  onStationSelect = () => {},
  onMapReady = () => {},
  onMapInstance = () => {},
  isFullscreen = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState(12);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const hasInitializedRef = useRef(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [hintMessage, setHintMessage] = useState(
    'Use two fingers to navigate the map'
  );
  const [mapActive, setMapActive] = useState(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track touch points for multitouch detection
  const touchPointsRef = useRef<number>(0);

  // Update hint message when fullscreen mode changes
  useEffect(() => {
    if (isMobile) {
      if (isFullscreen) {
        setHintMessage('You can drag the map with one finger');
      } else {
        setHintMessage('Use two fingers to navigate the map');
      }
    }

    // Always invalidate map size when fullscreen changes to ensure proper rendering
    if (mapRef.current) {
      // Use setTimeout to ensure the DOM has updated with the new fullscreen state
      setTimeout(() => {
        mapRef.current?.invalidateSize();

        // Maintain the center point when toggling fullscreen
        const currentCenter = mapRef.current?.getCenter();
        if (currentCenter) {
          mapRef.current?.setView(currentCenter, mapRef.current.getZoom(), {
            animate: false,
          });
        }
      }, 100);
    }
  }, [isMobile, isFullscreen]);

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = mapStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Handle initial hint
  useEffect(() => {
    if (isMobile && tilesLoaded && !hasInitializedRef.current) {
      // Show initial hint after a delay
      const timer = setTimeout(() => {
        setShowGestureHint(true);

        // Auto-hide after 4 seconds
        hintTimeoutRef.current = setTimeout(() => {
          setShowGestureHint(false);
        }, 4000);
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      };
    }
  }, [isMobile, tilesLoaded]);

  // Handle dragging based on fullscreen mode
  useEffect(() => {
    if (mapRef.current && isMobile) {
      if (isFullscreen) {
        // In fullscreen, enable dragging with one finger
        mapRef.current.dragging.enable();
      } else {
        // Otherwise, disable dragging (will be enabled with multi-touch)
        mapRef.current.dragging.disable();
      }
    }
  }, [isMobile, isFullscreen]);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !mapRef.current) return;

      // Prevent default to stop browser zoom/scroll behaviors
      e.preventDefault();

      // Skip if in fullscreen mode (one finger dragging already enabled)
      if (isFullscreen) return;

      const touchCount = e.touches.length;
      touchPointsRef.current = touchCount;

      if (touchCount >= 2) {
        // Multi-touch - enable map interactions
        e.stopPropagation();
        setMapActive(true);
        mapRef.current.dragging.enable();

        // Hide any hint
        setShowGestureHint(false);
        if (hintTimeoutRef.current) {
          clearTimeout(hintTimeoutRef.current);
        }
      } else if (touchCount === 1) {
        // Single touch - detect if user is trying to drag the map
        const initialY = e.touches[0].clientY;

        const handleTouchMove = (moveEvent: TouchEvent) => {
          // Prevent default to stop browser behaviors
          moveEvent.preventDefault();

          if (moveEvent.touches.length !== 1) return;

          const currentY = moveEvent.touches[0].clientY;
          const deltaY = Math.abs(currentY - initialY);

          // If user is trying to scroll vertically, show hint
          if (deltaY > 10 && !showGestureHint) {
            setHintMessage('Use two fingers to move the map');
            setShowGestureHint(true);

            // Auto-hide hint after 3 seconds
            if (hintTimeoutRef.current) {
              clearTimeout(hintTimeoutRef.current);
            }

            hintTimeoutRef.current = setTimeout(() => {
              setShowGestureHint(false);
            }, 3000);
          }
        };

        const handleTouchEnd = () => {
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, {
          passive: false, // Important to allow preventDefault
        });
        document.addEventListener('touchend', handleTouchEnd, { once: true });
      }
    },
    [isMobile, showGestureHint, isFullscreen]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !mapRef.current || isFullscreen) return;

    // If we were in multi-touch mode, set a timeout to disable dragging
    if (touchPointsRef.current >= 2) {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }

      touchTimeoutRef.current = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.dragging.disable();
          setMapActive(false);
        }
      }, 1000); // Keep map interactive for 1 second after touch ends
    }

    touchPointsRef.current = 0;
  }, [isMobile, isFullscreen]);

  // Notify parent about map ready state
  useEffect(() => {
    if (tilesLoaded && mapRef.current && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      onMapReady();
    }
  }, [tilesLoaded, onMapReady]);

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

  // Handle zoom change
  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  // Default center coordinates
  const defaultCenter = useMemo<[number, number]>(
    () => [33.6861871107659, 73.048283867797],
    []
  );

  // Center the map function
  const handleCenterMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, 12);
    }
  }, [defaultCenter]);

  // Get map center based on selection
  const getMapCenter = useCallback((): [number, number] => {
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
  }, [selectedStation, selectedLine, metroLines, defaultCenter]);

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
        <MapContainer
          center={getMapCenter()}
          zoom={zoomLevel}
          className={`transit-map-leaflet ${mapActive ? 'map-active' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}
          whenReady={handleMapReady}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          maxBoundsViscosity={1.0}
          minZoom={9}
          maxZoom={18}
          scrollWheelZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
          // Enable dragging by default on desktop, conditionally on mobile
          dragging={!isMobile || isFullscreen}
          // Disable browser's behaviors that might interfere
          preferCanvas={true}
          worldCopyJump={false}
        >
          {/* Attribution positioned at bottom-left with proper spacing */}
          <AttributionControl position="bottomleft" prefix={false} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <TileLoadTracker onTilesLoaded={handleTilesLoaded} />
          <ZoomListener onZoomChange={handleZoomChange} />
          <ResizeHandler
            setMapRef={(map) => {
              mapRef.current = map;
              if (map) {
                onMapInstance(map);
              }
            }}
            onMapReady={handleMapReady}
          />
          <ViewController selectedLine={selectedLine} metroLines={metroLines} />

          {/* Add metro lines as polylines */}
          {linesToDraw.map((line) => (
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
          ))}

          {/* Station markers */}
          <StationMarkerList
            stations={stationsToDisplay}
            selectedStation={selectedStation || null}
            onStationSelect={handleStationSelect}
            zoomLevel={zoomLevel}
            getLineName={getLineName}
          />
        </MapContainer>

        {/* Only show touch overlay when not in fullscreen mode on mobile */}
        {isMobile && !isFullscreen && (
          <div
            className="map-touch-overlay"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        )}
      </div>

      {/* Gesture hint only on mobile */}
      {isMobile && (
        <GestureHint visible={showGestureHint} message={hintMessage} />
      )}

      {/* Action buttons with better positioning */}
      <ControlPanel onCenterMap={handleCenterMap} />
    </div>
  );
};

export default TransitMapView;
