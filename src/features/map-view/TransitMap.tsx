'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStationCoordinates } from '../routes/utils/station-helpers';
import {
  groupStationsByIds,
  isFeederLine,
  organizeLinesToDraw,
} from '../routes/utils/map-helpers';

// Import all the extracted components
import MapController from './components/MapController';
import MapResizeHandler from './components/MapResizeHandler';
import TileLoadTracker from './components/TileLoadTracker';
import ZoomListener from './components/ZoomListener';
import MetroLine from './components/MetroLine';
import StationMarker from './components/StationMarker'; // Updated import
import MapTypeControls from './components/MapTypeControls';
import ResetViewButton from './components/ResetViewButton';
import ZoomHintButton from './components/ZoomHintButton';

const DefaultIcon = L.icon({
  iconUrl: '/images/icons/marker-icon.png',
  shadowUrl: '/images/icons/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  onLoadingChange?: (state: 'initial' | 'loading' | 'ready') => void;
}

const TransitMap: React.FC<TransitMapProps> = ({
  metroLines,
  selectedLine,
  className = 'h-[600px]',
  selectedStation = null,
  onStationSelect = () => {},
  onLoadingChange = () => {},
}) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [zoomLevel, setZoomLevel] = useState(12);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Notify parent about loading state changes (only on mount)
  useEffect(() => {
    onLoadingChange('loading');

    // Fallback mechanism to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      if (!tilesLoaded) {
        console.log('Fallback: forcing map to ready state');
        setTilesLoaded(true);
        setMapInitialized(true);
      }
    }, 6000); // 6 second safety timeout

    return () => clearTimeout(fallbackTimer);
  }, [onLoadingChange, tilesLoaded]);

  // Determine when the map is fully ready
  useEffect(() => {
    if (mapInitialized && tilesLoaded) {
      console.log('Map is fully ready - transitioning to ready state');
      onLoadingChange('ready');
    }
  }, [mapInitialized, tilesLoaded, onLoadingChange]);

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
    console.log('Tiles loaded');
    setTilesLoaded(true);
  }, []);

  // Handle map fully initialized
  const handleMapReady = useCallback(() => {
    console.log('Map initialized');
    setMapInitialized(true);
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

  // Zoom to details
  const handleZoomToDetails = useCallback(() => {
    setZoomLevel(Math.min(14, zoomLevel + 2));
    if (mapRef.current) {
      mapRef.current.setZoom(Math.min(14, zoomLevel + 2));
    }
  }, [zoomLevel]);

  // Get the organized lines
  const linesToDraw = organizeLinesToDraw(metroLines, selectedLine);

  // Check for high zoom level (more detail)
  const isHighZoom = zoomLevel >= 14;

  // Get all stations that should be displayed with their corresponding lines
  const stationsToDisplay = groupStationsByIds(linesToDraw);

  // Display line names correctly in the popup
  const getLineName = (lineId: string): string => {
    const line = metroLines.find((l) => l.id === lineId);
    return line ? line.name : lineId;
  };

  return (
    <div
      className={`transit-map-container ${className}`}
      style={{ minHeight: '400px', position: 'relative' }}
      ref={mapContainerRef}
    >
      <MapTypeControls mapType={mapType} setMapType={setMapType} />

      <div className="map-container-wrapper">
        <MapContainer
          key={`map-${mapType}-${className}`}
          center={getMapCenter()}
          zoom={zoomLevel}
          className="transit-map-leaflet"
          whenReady={() => {
            setTimeout(() => handleMapReady(), 100);
          }}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Position ZoomControl bottom-right but with enough margin for Reset button */}
          <ZoomControl position="bottomright" />

          {mapType === 'streets' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
              url="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHJhYmh1bGlua2xuIiwiYSI6ImNrZzcxdWpkbzEzNWgzMmx3MXhyaDZmYWcifQ.Wf-lZ3g-yWAvBbxZMdD6Zw"
            />
          )}

          <TileLoadTracker onTilesLoaded={handleTilesLoaded} />
          <ZoomListener onZoomChange={handleZoomChange} />
          <MapResizeHandler
            setMapRef={(map) => {
              mapRef.current = map;
            }}
            onMapReady={handleMapReady}
          />
          <MapController selectedLine={selectedLine} metroLines={metroLines} />

          {/* Add metro lines as polylines with proper layering and zoom-based styling */}
          {linesToDraw.map((line, lineIndex) => (
            <MetroLine
              key={line.id}
              stations={line.stations}
              color={line.color || '#4A5568'}
              isFeeder={isFeederLine(line.id)}
              lineIndex={lineIndex}
              totalLines={linesToDraw.length}
              zoomLevel={zoomLevel}
              lineName={getLineName(line.id)}
              lineId={line.id}
              isSelectedLine={selectedLine === line.id}
            />
          ))}

          {/* Add station markers with our updated component */}
          {stationsToDisplay.map((station) => (
            <StationMarker
              key={station.stationId}
              stationId={station.stationId}
              lines={station.lines.map((line) => ({
                ...line,
                name: getLineName(line.id),
              }))}
              isHighZoom={isHighZoom}
              selectedStation={selectedStation}
              onStationSelect={onStationSelect}
            />
          ))}
        </MapContainer>
      </div>

      {/* Reposition reset button to not overlap with zoom controls */}
      {(selectedLine || selectedStation) && (
        <ResetViewButton onClick={handleReset} />
      )}

      {/* Add a button to toggle station visibility at lower zoom levels */}
      {zoomLevel < 12 && <ZoomHintButton onClick={handleZoomToDetails} />}
    </div>
  );
};

export default TransitMap;
