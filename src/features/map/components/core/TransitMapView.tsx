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
  /* Mobile touch behavior - allow page scroll with one finger, map pan with two */
  @media (max-width: 768px) {
    .leaflet-container {
      /* Allow vertical scroll with one finger */
      touch-action: pan-y !important;
    }
    
    /* When map is active (two fingers), disable browser scroll */
    /* Handled by leaflet-gesture-handling */
    /* .leaflet-container.map-active {
      touch-action: none !important;
      cursor: grab;
    } */
    
    /* In fullscreen, allow map to capture all touch events */
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
    /* Handled by external Control Panel now */
    /* .map-controls {
      right: 60px;
      flex-direction: row;
      gap: 8px;
    } */
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

// Control panel for mobile Locate button
const ControlPanel: React.FC<{
  onCenterMap: () => void;
}> = ({ onCenterMap }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Only show this control panel on mobile
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

  // Update hint message when fullscreen mode changes
  useEffect(() => {
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

        // Re-configure gesture handling after fullscreen state change
        const map = mapRef.current;
        if (!map) return;

        const mapWithGestureHandling = map as L.Map & {
          gestureHandling?: { enable: () => void; disable: () => void };
        };
        if (isMobile && isFullscreen) {
          mapWithGestureHandling.gestureHandling?.disable();
          map.dragging.enable();
        } else if (isMobile) {
          mapWithGestureHandling.gestureHandling?.enable();
          map.dragging.disable();
        }
      }, 100);
    }
  }, [isFullscreen, isMobile]); // Add isMobile dependency

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = mapStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Ensure map responds correctly to resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // This function will be called when MapContainer is fully loaded
  const handleMapInit = useCallback(
    (map: L.Map) => {
      // Store the map reference
      mapRef.current = map;

      // Pass the map instance to parent component
      onMapInstance(map);

      // Configure gesture handling and dragging based on fullscreen state
      const mapWithGestureHandling = map as L.Map & {
        gestureHandling?: { enable: () => void; disable: () => void };
      };
      if (isMobile && isFullscreen) {
        // Fullscreen mobile: disable gesture handling, enable standard dragging
        mapWithGestureHandling.gestureHandling?.disable();
        map.dragging.enable();
      } else if (isMobile) {
        // Non-fullscreen mobile: enable gesture handling, disable standard dragging initially
        mapWithGestureHandling.gestureHandling?.enable();
        map.dragging.disable(); // Gesture handling will enable it on two-finger touch
      } else {
        // Desktop: Gesture handling likely not needed, ensure standard dragging is on
        mapWithGestureHandling.gestureHandling?.disable();
        map.dragging.enable();
      }

      // Listen for fullscreen change events from browser
      document.addEventListener('fullscreenchange', () => {
        const map = mapRef.current;
        if (!document.fullscreenElement && isFullscreen && map) {
          // Handle case when user exits fullscreen via browser UI/back button
          // Re-evaluate dragging state based on the new fullscreen status
          if (isMobile) {
            map.dragging.disable();
            // Also re-enable gesture handling if needed
            const mapWithGestureHandling = map as L.Map & {
              gestureHandling?: { enable: () => void; disable: () => void };
            };
            mapWithGestureHandling.gestureHandling?.enable();
          }
        }
      });
    },
    [isMobile, isFullscreen, onMapInstance]
  );

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

  // Handle map initialization (just invalidate size)
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
          className={`transit-map-leaflet ${isFullscreen ? 'fullscreen-mode' : ''}`}
          whenReady={handleMapReady}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          maxBoundsViscosity={1.0}
          minZoom={9}
          maxZoom={18}
          scrollWheelZoom={true}
          // Explicitly set dragging based only on desktop/fullscreen status
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
            setMapRef={handleMapInit}
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
      </div>

      {/* Mobile-only Control Panel for Locate button */}
      <ControlPanel onCenterMap={handleCenterMap} />
    </div>
  );
};

export default TransitMapView;
