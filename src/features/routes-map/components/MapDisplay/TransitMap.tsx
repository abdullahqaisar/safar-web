'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getStationCoordinates,
  getStationNameById,
  isTransferStation,
} from '../../utils/station-helpers';

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

const MapController = ({
  selectedLine,
  metroLines,
}: {
  selectedLine?: string;
  metroLines: Array<{
    id: string;
    name: string;
    stations: string[];
    color?: string;
  }>;
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLine) {
      // Fit bounds to show the entire selected line
      const selectedLineData = metroLines.find(
        (line) => line.id === selectedLine
      );
      if (selectedLineData && selectedLineData.stations.length) {
        const bounds = selectedLineData.stations.map((stationId) =>
          getStationCoordinates(stationId)
        );
        map.fitBounds(bounds as L.LatLngBoundsExpression, {
          padding: [50, 50],
        });
      }
    } else {
      // Reset view to show all lines - center on Kashmir Highway which is central
      map.setView([33.6861871107659, 73.048283867797], 12);
    }
  }, [selectedLine, metroLines, map]);

  return null;
};

// Component to ensure the map is properly sized and handles resize events
const MapResizeHandler = ({
  setMapRef,
  onMapReady,
}: {
  setMapRef: (map: L.Map) => void;
  onMapReady: () => void;
}) => {
  const map = useMap();

  // Store map reference
  useEffect(() => {
    setMapRef(map);

    // Ensure map is properly sized immediately
    if (map) {
      map.invalidateSize();
    }
  }, [map, setMapRef]);

  // Function to forcefully invalidate the map size
  const forceResizeMap = useCallback(() => {
    if (map) {
      map.invalidateSize();
    }
  }, [map]);

  // Handle window resize events
  useEffect(() => {
    window.addEventListener('resize', forceResizeMap);

    // Force resize on component mount with a series of timed invalidations
    const timers = [
      setTimeout(forceResizeMap, 100),
      setTimeout(() => {
        forceResizeMap();
        onMapReady(); // Signal that the map is ready after all resizing
      }, 500),
    ];

    return () => {
      window.removeEventListener('resize', forceResizeMap);
      timers.forEach(clearTimeout);
    };
  }, [forceResizeMap, onMapReady]);

  return null;
};

// Component to track tiles loading completion
const TileLoadTracker = ({ onTilesLoaded }: { onTilesLoaded: () => void }) => {
  const map = useMap();
  const loadTrackerRef = useRef({ hasLoaded: false });

  useEffect(() => {
    // Improved tile loading tracking that counts tiles
    let activeTiles = 0;
    let loadedTiles = 0;

    const handleTileLoadStart = () => {
      activeTiles++;
    };

    const handleTileLoad = () => {
      loadedTiles++;

      // Consider loaded when we've loaded at least some tiles and no new ones are pending
      if (
        loadedTiles > 0 &&
        loadedTiles >= activeTiles &&
        !loadTrackerRef.current.hasLoaded
      ) {
        loadTrackerRef.current.hasLoaded = true;
        onTilesLoaded();
      }
    };

    const handleTileError = () => {
      loadedTiles++;

      if (loadedTiles >= activeTiles && !loadTrackerRef.current.hasLoaded) {
        loadTrackerRef.current.hasLoaded = true;
        onTilesLoaded();
      }
    };

    // Fallback timer to ensure we exit loading state after a timeout
    const fallbackTimer = setTimeout(() => {
      if (!loadTrackerRef.current.hasLoaded) {
        loadTrackerRef.current.hasLoaded = true;
        onTilesLoaded();
      }
    }, 4000); // 4 seconds fallback

    map.on('tileloadstart', handleTileLoadStart);
    map.on('tileload', handleTileLoad);
    map.on('tileerror', handleTileError);

    // Also listen to general map load event as backup
    map.on('load', () => {
      setTimeout(() => {
        if (!loadTrackerRef.current.hasLoaded) {
          loadTrackerRef.current.hasLoaded = true;
          onTilesLoaded();
        }
      }, 500);
    });

    return () => {
      clearTimeout(fallbackTimer);
      map.off('tileloadstart', handleTileLoadStart);
      map.off('tileload', handleTileLoad);
      map.off('tileerror', handleTileError);
      map.off('load');
    };
  }, [map, onTilesLoaded]);

  return null;
};

// Component to track zoom level
const ZoomListener = ({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void;
}) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
};

// Define the MetroLine component
const MetroLine = ({
  stations,
  color,
}: {
  stations: string[];
  color: string;
}) => {
  // Build line coordinates
  const stationCoords = stations.map(getStationCoordinates);

  return (
    <Polyline
      positions={stationCoords}
      color={color}
      weight={5}
      opacity={0.85}
    />
  );
};

// Custom station marker component with label
const StationMarker = ({
  stationId,
  lineColor,
  isTransfer,
  isHighZoom,
  selectedStation,
  onStationSelect,
}: {
  stationId: string;
  lineColor: string;
  isTransfer: boolean;
  isHighZoom: boolean;
  selectedStation?: string | null;
  onStationSelect?: (stationId: string | null) => void;
}) => {
  const coordinates = getStationCoordinates(stationId);
  const stationName = getStationNameById(stationId);
  const isSelected = selectedStation === stationId;

  // Create custom icon for station with or without label depending on zoom level and selection
  const markerSize = isTransfer ? 12 : 8;
  const displaySize = isSelected ? markerSize * 1.5 : markerSize;
  const borderWidth = isSelected ? 3 : 2;
  const shouldShowLabel = isHighZoom || isSelected;

  const stationIcon = L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="position: relative; cursor: pointer;" onclick="window.selectStation('${stationId}')">
        <div style="
          width: ${displaySize}px; 
          height: ${displaySize}px; 
          border-radius: 50%; 
          background-color: ${isTransfer ? '#FFFFFF' : lineColor}; 
          border: ${borderWidth}px solid ${lineColor};
          box-shadow: 0 0 4px rgba(0,0,0,0.2);
        "></div>
        ${
          shouldShowLabel
            ? `<div style="
                position: absolute;
                top: ${displaySize + 2}px;
                left: 50%;
                transform: translateX(-50%);
                background-color: ${
                  isSelected ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.7)'
                };
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                white-space: nowrap;
                z-index: 1000;
              ">${stationName}</div>`
            : ''
        }
      </div>
    `,
    iconSize: [displaySize + 10, displaySize + (shouldShowLabel ? 30 : 10)],
    iconAnchor: [displaySize / 2 + 5, displaySize / 2 + 5],
  });

  // Add global click handler for station selection
  useEffect(() => {
    // Expose station selection function to window for the onclick handler
    if (onStationSelect) {
      // @ts-expect-error - Adding a custom property to window
      window.selectStation = (id: string) => {
        onStationSelect(id);
      };
    }

    return () => {
      // Clean up
      // @ts-expect-error - Removing a custom property from window
      window.selectStation = undefined;
    };
  }, [onStationSelect]);

  return (
    <Marker position={coordinates} icon={stationIcon}>
      <Popup className="station-popup">
        <div className="p-3 text-sm">
          <h3 className="font-semibold mb-1">{stationName}</h3>
          {isTransfer && (
            <p className="text-xs mt-1 font-medium text-indigo-600">
              Transfer Station
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

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

  // Handle zoom changes
  const handleZoomEnd = (zoom: number) => {
    setZoomLevel(zoom);
  };

  // Determine which lines to display
  const linesToDraw = selectedLine
    ? metroLines.filter((line) => line.id === selectedLine)
    : metroLines;

  // Check for high zoom level (more detail)
  const isHighZoom = zoomLevel >= 14;

  return (
    <div
      className={`transit-map-container ${className}`}
      style={{ minHeight: '400px', position: 'relative' }}
      ref={mapContainerRef}
    >
      <div className="absolute top-3 right-3 z-[999] flex flex-col gap-2">
        <div className="bg-white rounded-md shadow-md p-2 flex gap-2">
          <button
            onClick={() => setMapType('streets')}
            className={`px-2 py-1 text-xs font-medium rounded ${
              mapType === 'streets'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            Streets
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2 py-1 text-xs font-medium rounded ${
              mapType === 'satellite'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

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
          <ZoomListener onZoomChange={handleZoomEnd} />
          <MapResizeHandler
            setMapRef={(map) => {
              mapRef.current = map;
            }}
            onMapReady={handleMapReady}
          />
          <MapController selectedLine={selectedLine} metroLines={metroLines} />

          {/* Add metro lines as polylines */}
          {linesToDraw.map((line) => (
            <MetroLine
              key={line.id}
              stations={line.stations}
              color={line.color || '#4A5568'}
            />
          ))}

          {/* Add station markers with labels */}
          {linesToDraw.map((line) =>
            line.stations.map((stationId) => (
              <StationMarker
                key={`${line.id}-${stationId}`}
                stationId={stationId}
                lineColor={line.color || '#4A5568'}
                isTransfer={isTransferStation(stationId)}
                isHighZoom={isHighZoom}
                selectedStation={selectedStation}
                onStationSelect={onStationSelect}
              />
            ))
          )}
        </MapContainer>
      </div>

      {(selectedLine || selectedStation) && (
        <button
          className="absolute bottom-4 right-4 z-[999] bg-white rounded-md shadow-md px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1"
          onClick={handleReset}
        >
          Reset View
        </button>
      )}
    </div>
  );
};

export default TransitMap;
