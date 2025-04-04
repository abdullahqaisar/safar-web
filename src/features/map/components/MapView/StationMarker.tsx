import { useState, useMemo, useCallback, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  getStationCoordinates,
  getStationNameById,
} from '../../utils/station-helpers';

// Update Line interface to match
interface Line {
  id: string;
  color?: string;
  name?: string; // Make name optional
}

interface StationMarkerProps {
  stationId: string;
  lines: Line[];
  selectedStation: string | null;
  onStationSelect: (stationId: string | null) => void;
}

// Generate cached icon creators for better performance
const iconCache = new Map<string, L.DivIcon>();

// Helper function to get a cached icon or create a new one
const getCachedIcon = (
  isTransferPoint: boolean,
  lines: Line[],
  isSelected: boolean,
  isHovered: boolean
): L.DivIcon => {
  // Create a unique key for this icon configuration
  const baseSize = isSelected ? 18 : isHovered ? 16 : 14;
  const cacheKey = `${isTransferPoint ? 'transfer' : 'single'}_${lines
    .map((l) => l.id + l.color)
    .join('_')}_${isSelected ? 'selected' : ''}_${
    isHovered ? 'hovered' : ''
  }_${baseSize}`;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  // Create new icon based on type
  let icon: L.DivIcon;

  if (!isTransferPoint) {
    const color = lines[0]?.color || '#3B82F6';
    icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${color}; 
        border: 2px solid white;
        width: ${baseSize}px;
        height: ${baseSize}px;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        ${isSelected ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);' : ''}
      "></div>`,
      iconSize: [baseSize, baseSize],
      iconAnchor: [baseSize / 2, baseSize / 2],
    });
  } else {
    // For multi-line stations, use the pill design
    const dotSize = Math.max(5, baseSize / 4);
    const dotSpacing = 2;
    const pillPadding = 4;
    const pillHeight = dotSize + pillPadding * 2;

    // Calculate pill width based on number of lines
    const pillWidth =
      pillPadding * 2 + // Left and right padding
      lines.length * dotSize + // All dots
      (lines.length - 1) * dotSpacing; // Spacing between dots

    // Create dots for each line
    const dots = lines
      .map((line, index) => {
        const leftPosition = pillPadding + index * (dotSize + dotSpacing);
        return `
        <div style="
          position: absolute;
          left: ${leftPosition}px;
          top: 50%;
          transform: translateY(-50%);
          width: ${dotSize}px;
          height: ${dotSize}px;
          border-radius: 50%;
          background-color: ${line.color || '#4A5568'};
          transition: all 0.2s ease;
        "></div>
      `;
      })
      .join('');

    icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: ${pillWidth}px;
        height: ${pillHeight}px;
        background-color: ${isSelected ? '#F9FAFB' : 'white'};
        border: 1px solid ${isSelected ? 'rgba(59, 130, 246, 0.5)' : '#E5E7EB'};
        border-radius: ${pillHeight / 2}px;
        position: relative;
        ${
          isSelected
            ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);'
            : 'box-shadow: 0 1px 3px rgba(0,0,0,0.2);'
        }
        transition: all 0.2s ease;
      ">${dots}</div>`,
      iconSize: [pillWidth, pillHeight],
      iconAnchor: [pillWidth / 2, pillHeight / 2],
    });
  }

  // Store in cache and return
  iconCache.set(cacheKey, icon);
  return icon;
};

// Limit cache size to prevent memory issues
const limitCacheSize = () => {
  if (iconCache.size > 200) {
    // Keep only the first 100 items when we exceed 200
    const keysToDelete = Array.from(iconCache.keys()).slice(0, 100);
    keysToDelete.forEach((key) => iconCache.delete(key));
  }
};

// Memoized station marker component
const StationMarker = memo(
  function StationMarker({
    stationId,
    lines,
    selectedStation,
    onStationSelect,
  }: StationMarkerProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isSelected = selectedStation === stationId;
    const isTransferPoint = lines.length > 1;

    // Stable coordinates and name - compute once
    const coordinates = useMemo(
      () => getStationCoordinates(stationId),
      [stationId]
    );
    const stationName = useMemo(
      () => getStationNameById(stationId),
      [stationId]
    );

    // Get icon with caching for better performance
    const icon = useMemo(() => {
      const result = getCachedIcon(
        isTransferPoint,
        lines,
        isSelected,
        isHovered
      );
      limitCacheSize();
      return result;
    }, [isTransferPoint, lines, isSelected, isHovered]);

    // Stable event handlers to prevent rerenders
    const handleClick = useCallback(
      () => onStationSelect(stationId),
      [onStationSelect, stationId]
    );
    const handleMouseOver = useCallback(() => setIsHovered(true), []);
    const handleMouseOut = useCallback(() => setIsHovered(false), []);

    // Enhanced popup content with more accessible information
    const popupContent = useMemo(() => {
      const stationTypeLabel = isTransferPoint
        ? 'Transfer Station'
        : 'Regular Station';

      return `
        <div class="text-xs py-1">
          <strong class="font-medium block mb-1">${stationName}</strong>
          <div class="text-xs text-gray-500 mb-1.5">${stationTypeLabel}</div>
          <div class="space-y-0.5">
            ${lines
              .map(
                (line) => `
              <div class="flex items-center gap-1.5">
                <div 
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  style="background-color: ${line.color || '#4A5568'}"
                ></div>
                <span class="text-gray-700 truncate max-w-[180px]">
                  ${line.name || line.id}
                </span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }, [stationName, isTransferPoint, lines]);

    return (
      <Marker
        position={coordinates}
        icon={icon}
        eventHandlers={{
          click: handleClick,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
          keypress: (e) => {
            if (e.originalEvent.key === 'Enter') {
              handleClick();
            }
          },
        }}
        zIndexOffset={isSelected ? 1000 : isHovered ? 900 : 0}
        keyboard={true} // Enable keyboard navigation
        title={`${stationName} - ${
          isTransferPoint ? 'Transfer Station' : 'Station'
        }`} // Tooltip for accessibility
      >
        <Popup>
          <div dangerouslySetInnerHTML={{ __html: popupContent }} />
        </Popup>
      </Marker>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if one of these specific props changed
    return (
      prevProps.stationId === nextProps.stationId &&
      prevProps.selectedStation === nextProps.selectedStation &&
      prevProps.lines === nextProps.lines
    );
  }
);

export default StationMarker;
