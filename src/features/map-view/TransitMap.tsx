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
import { getStationCoordinates } from '../routes/utils/station-helpers';
import {
  groupStationsByIds,
  isFeederLine,
  organizeLinesToDraw,
} from '../routes/utils/map-helpers';
import { buildParallelLineGroups } from './utils/parallelLineHelper';

// Import all the extracted components
import MapController from './components/MapController';
import MapResizeHandler from './components/MapResizeHandler';
import TileLoadTracker from './components/TileLoadTracker';
import ZoomListener from './components/ZoomListener';
import MetroLine from './components/MetroLine';
import StationMarkerList from './components/StationMarkerList';
import { RotateCcw, ZoomIn } from 'lucide-react';

const DefaultIcon = L.icon({
  iconUrl: '/images/icons/marker-icon.png',
  shadowUrl: '/images/icons/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create a memoized version of MetroLine for better performance
const MemoizedMetroLine = React.memo(MetroLine, (prevProps, nextProps) => {
  return (
    prevProps.stations === nextProps.stations &&
    prevProps.color === nextProps.color &&
    prevProps.isFeeder === nextProps.isFeeder &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.isSelectedLine === nextProps.isSelectedLine &&
    prevProps.lineId === nextProps.lineId &&
    prevProps.parallelLineGroups === nextProps.parallelLineGroups
  );
});

interface TransitMapProps {
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

// Updated MapControls component to show in top-left corner without keyboard controls
const MapControls: React.FC<{
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

const TransitMap: React.FC<
  TransitMapProps & {
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

  // Use a single ref to track initialization instead of multiple state variables
  const hasInitializedRef = useRef(false);

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

  // Handle tiles loaded callback with debounce to avoid multiple calls
  const handleTilesLoaded = useCallback(() => {
    setTilesLoaded(true);
  }, []);

  // Handle map fully initialized
  const handleMapReady = useCallback(() => {
    if (mapRef.current) {
      // Force immediate size recomputation
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

  // Find center of the map based on selected station or default center
  const getMapCenter = useCallback((): [number, number] => {
    const defaultCenter: [number, number] = [33.6861871107659, 73.048283867797]; // Kashmir Highway

    // If a station is selected, center on it
    if (selectedStation) {
      return getStationCoordinates(selectedStation);
    }

    if (selectedLine) {
      const line = metroLines.find((l) => l.id === selectedLine);
      if (line && line.stations.length > 0) {
        // Get coordinates of all stations in the selected line
        const coords = line.stations.map(getStationCoordinates);

        // Calculate average lat and lng for the center
        const totalLat = coords.reduce((sum, coord) => sum + coord[0], 0);
        const totalLng = coords.reduce((sum, coord) => sum + coord[1], 0);

        return [totalLat / coords.length, totalLng / coords.length];
      }
    }

    return defaultCenter;
  }, [metroLines, selectedLine, selectedStation]);

  // Zoom to details with smooth animation
  const handleZoomToDetails = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(getMapCenter(), Math.min(14, zoomLevel + 2), {
        duration: 1.2,
        animate: true,
      });
    }
    setZoomLevel(Math.min(14, zoomLevel + 2));
  }, [zoomLevel, getMapCenter]);

  // Get the organized lines - memoize to prevent unnecessary recalculations
  const linesToDraw = useMemo(
    () => organizeLinesToDraw(metroLines, selectedLine),
    [metroLines, selectedLine]
  );

  // Get all stations that should be displayed with their corresponding lines - memoize
  const stationsToDisplay = useMemo(
    () => groupStationsByIds(linesToDraw),
    [linesToDraw]
  );

  // Memoize station line name lookup function to avoid recreating functions
  const getLineName = useCallback(
    (lineId: string): string => {
      const line = metroLines.find((l) => l.id === lineId);
      return line ? line.name : lineId;
    },
    [metroLines]
  );

  // Handle station selection without triggering loading states
  const handleStationSelect = useCallback(
    (stationId: string | null) => {
      // Execute callback directly without changing loading state
      onStationSelect(stationId);

      // If we want to pan to the selected station
      if (stationId && mapRef.current) {
        const coordinates = getStationCoordinates(stationId);
        mapRef.current.panTo(coordinates, { animate: true });
      }
    },
    [onStationSelect]
  );

  // Calculate parallel line groups for proper offsetting
  const parallelLineGroups = useMemo(
    () => buildParallelLineGroups(metroLines),
    [metroLines]
  );

  return (
    <div
      className={`transit-map-container ${className}`}
      style={{ minHeight: '400px', position: 'relative' }}
      ref={mapContainerRef}
      tabIndex={0} // Make container focusable for keyboard navigation
      aria-label="Interactive transit map"
    >
      <div className="map-container-wrapper relative">
        <MapContainer
          center={getMapCenter()}
          zoom={zoomLevel}
          className="transit-map-leaflet"
          whenReady={handleMapReady}
          zoomControl={false} // Disable default zoom control as we're using our custom one
          attributionControl={false} // We'll add our own for better positioning
          style={{ height: '100%', width: '100%' }}
          // Add improved map options for better UX
          maxBoundsViscosity={1.0}
          minZoom={9}
          maxZoom={18}
          scrollWheelZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
        >
          {/* Attribution positioned at bottom-left */}
          <AttributionControl position="bottomleft" prefix={false} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <TileLoadTracker onTilesLoaded={handleTilesLoaded} />
          <ZoomListener onZoomChange={handleZoomChange} />
          <MapResizeHandler
            setMapRef={(map) => {
              mapRef.current = map;
              if (map) {
                onMapInstance(map);
              }
            }}
            onMapReady={handleMapReady}
          />
          <MapController selectedLine={selectedLine} metroLines={metroLines} />

          {/* Add metro lines as polylines with proper parallel line handling */}
          {linesToDraw.map((line) => (
            <MemoizedMetroLine
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

          {/* Use optimized station marker list for better performance */}
          <StationMarkerList
            stations={stationsToDisplay}
            selectedStation={selectedStation || null}
            onStationSelect={handleStationSelect}
            zoomLevel={zoomLevel}
            getLineName={getLineName}
          />
        </MapContainer>
      </div>

      {/* Action buttons in top-left corner */}
      <MapControls
        zoomLevel={zoomLevel}
        isSelectionActive={Boolean(selectedLine || selectedStation)}
        onReset={handleReset}
        onZoomToDetails={handleZoomToDetails}
        onResetFilters={onResetFilters}
      />
    </div>
  );
};

export default TransitMap;
