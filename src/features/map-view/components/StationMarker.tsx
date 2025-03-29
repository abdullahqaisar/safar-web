import { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  getStationCoordinates,
  getStationNameById,
} from '../../routes/utils/station-helpers';

interface Line {
  id: string;
  color?: string;
  name: string;
}

interface StationMarkerProps {
  stationId: string;
  lines: Line[];
  isHighZoom: boolean;
  selectedStation: string | null;
  onStationSelect: (stationId: string | null) => void;
}

export default function StationMarker({
  stationId,
  lines,
  isHighZoom,
  selectedStation,
  onStationSelect,
}: StationMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedStation === stationId;

  // Generate marker based on station type and zoom level
  const icon = useMemo(() => {
    const isTransferPoint = lines.length > 1;
    const size = isSelected ? 18 : isHovered ? 16 : 14;

    if (!isTransferPoint) {
      // Regular station - filling with color instead of white
      const color = lines[0]?.color || '#3B82F6';
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
          background-color: ${color}; // Always filled with line color
          border: 2px solid ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    if (isHighZoom) {
      // Pill/badge for zoomed-in view - make it bigger
      const dotSize = Math.max(5, size / 3.5); // Increased from 4 to 5
      const dotSpacing = 3; // Increased from 2 to 3
      const pillPadding = 4; // Increased from 3 to 4
      const pillWidth =
        dotSize * lines.length +
        dotSpacing * (lines.length - 1) +
        pillPadding * 2;
      const pillHeight = dotSize + pillPadding * 2;

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
          background-color: ${isSelected ? '#E5E7EB' : 'white'};
          border: 1px solid #333;
          border-radius: ${pillHeight / 2}px;
          position: relative;
          ${isSelected ? 'box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);' : ''}
        ">${dots}</div>`,
        iconSize: [pillWidth, pillHeight],
        iconAnchor: [pillWidth / 2, pillHeight / 2],
      });
    } else {
      // Pie chart for zoomed-out view - with filled color segments
      const segments = lines
        .map((line, i) => {
          const segmentSize = 1 / lines.length;
          const startAngle = i * segmentSize * 2 * Math.PI;
          const endAngle = (i + 1) * segmentSize * 2 * Math.PI;

          // Create a path for a pie segment
          const startX = size / 2 + Math.cos(startAngle) * (size / 2);
          const startY = size / 2 + Math.sin(startAngle) * (size / 2);
          const endX = size / 2 + Math.cos(endAngle) * (size / 2);
          const endY = size / 2 + Math.sin(endAngle) * (size / 2);

          const largeArc = segmentSize > 0.5 ? 1 : 0;

          return `
            <path 
              d="M ${size / 2} ${size / 2} L ${startX} ${startY} A ${
            size / 2
          } ${size / 2} 0 ${largeArc} 1 ${endX} ${endY} Z"
              fill="${line.color || '#4A5568'}"
              stroke="#333"
              stroke-width="0.5"
            />
          `;
        })
        .join('');

      return L.divIcon({
        className: 'custom-div-icon',
        html: `
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${
          size / 2 - 0.5
        }" fill="none" stroke="#333" stroke-width="1"/>
            ${segments}
          </svg>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }
  }, [lines, isHighZoom, isSelected, isHovered]);

  const coordinates = getStationCoordinates(stationId);

  const stationName = getStationNameById(stationId);

  return (
    <Marker
      position={coordinates}
      icon={icon}
      eventHandlers={{
        click: () => {
          onStationSelect(stationId);
        },
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
      }}
    >
      <Popup>
        <div className="text-xs">
          <strong>{stationName}</strong>
          <div className="mt-1">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center mb-0.5">
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: line.color || '#4A5568' }}
                ></div>
                <span>{line.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
