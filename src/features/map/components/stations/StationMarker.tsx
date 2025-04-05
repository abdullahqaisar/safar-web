import { useState } from 'react';
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

// Create icon based on station type and state
const createStationIcon = (
  isTransferPoint: boolean,
  lines: Line[],
  isSelected: boolean,
  isHovered: boolean
): L.DivIcon => {
  const baseSize = isSelected ? 18 : isHovered ? 16 : 14;

  // Simple station marker for regular stations
  if (!isTransferPoint) {
    const color = lines[0]?.color || '#3B82F6';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${color}; 
        border: 2px solid white;
        width: ${baseSize}px;
        height: ${baseSize}px;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ${isSelected ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);' : ''}
      "></div>`,
      iconSize: [baseSize, baseSize],
      iconAnchor: [baseSize / 2, baseSize / 2],
    });
  }

  // For multi-line stations, use the pill design with dots
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
      "></div>
    `;
    })
    .join('');

  return L.divIcon({
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
    ">${dots}</div>`,
    iconSize: [pillWidth, pillHeight],
    iconAnchor: [pillWidth / 2, pillHeight / 2],
  });
};

function StationMarker({
  stationId,
  lines,
  selectedStation,
  onStationSelect,
}: StationMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedStation === stationId;
  const isTransferPoint = lines.length > 1;

  // Get coordinates and name
  const coordinates = getStationCoordinates(stationId);
  const stationName = getStationNameById(stationId);

  // Create icon based on station characteristics
  const icon = createStationIcon(isTransferPoint, lines, isSelected, isHovered);

  // Create popup content
  const popupContent = `
    <div class="text-xs py-1">
      <strong class="font-medium block mb-1">${stationName}</strong>
      <div class="text-xs text-gray-500 mb-1.5">
        ${isTransferPoint ? 'Transfer Station' : 'Regular Station'}
      </div>
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

  return (
    <Marker
      position={coordinates}
      icon={icon}
      eventHandlers={{
        click: () => onStationSelect(stationId),
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
        keypress: (e) => {
          if (e.originalEvent.key === 'Enter') {
            onStationSelect(stationId);
          }
        },
      }}
      zIndexOffset={isSelected ? 1000 : isHovered ? 900 : 0}
      keyboard={true}
      title={`${stationName} - ${
        isTransferPoint ? 'Transfer Station' : 'Station'
      }`}
    >
      <Popup>
        <div dangerouslySetInnerHTML={{ __html: popupContent }} />
      </Popup>
    </Marker>
  );
}

export default StationMarker;
