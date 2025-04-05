'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const getMapCenter = (): [number, number] => {
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
  };

  // Zoom to details
  const handleZoomToDetails = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(getMapCenter(), Math.min(14, zoomLevel + 2), {
        duration: 1.2,
        animate: true,
      });
    }
  }, [zoomLevel]);

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
      className={`transit-map-container ${className}`}
      style={{ minHeight: '400px', position: 'relative' }}
      ref={mapContainerRef}
      tabIndex={0}
      aria-label="Interactive transit map"
    >
      <div className="map-container-wrapper relative">
        <MapContainer
          center={getMapCenter()}
          zoom={zoomLevel}
          className="transit-map-leaflet"
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
        >
          {/* Attribution positioned at bottom-left */}
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
      </div>

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
