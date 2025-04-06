import React from 'react';
import L from 'leaflet';
import { Marker } from 'react-leaflet';

interface LineLabelProps {
  position: [number, number];
  rotation: number;
  color: string;
  text: string;
  isHighlighted: boolean;
  shouldFade: boolean;
  isFeeder?: boolean; // Add support for feeder route styling
}

export default function LineLabel({
  position,
  rotation,
  color,
  text,
  isHighlighted,
  shouldFade,
  isFeeder = false,
}: LineLabelProps) {
  // Calculate dynamic width based on text
  const textLength = text.length;
  const minWidth = 40;
  const widthPerChar = 6; // Approximate width per character
  const dynamicWidth = Math.max(minWidth, textLength * widthPerChar + 16);

  // Calculate text color for optimal contrast
  const getTextColor = () => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    // Use luminance formula to determine if we need light or dark text
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const textColor = getTextColor();

  // Style differently for feeder routes - use light teal for better distinction
  const feederColor = '#4FD1C5'; // Light teal color matching TransitRoute
  const displayColor = isFeeder ? feederColor : color;
  const backgroundColor = isFeeder ? 'white' : displayColor;
  const labelTextColor = isFeeder ? feederColor : textColor;
  const labelBorder = isFeeder
    ? `1px solid ${feederColor}`
    : isHighlighted
    ? '1px solid white'
    : 'none';

  // Create label icon with our styling
  const labelIcon = L.divIcon({
    className: 'metro-line-label',
    html: `
      <div class="label-container" style="
        position: relative;
        width: ${dynamicWidth}px;
        height: 22px;
        display: flex;
        justify-content: center;
        align-items: center;
        transform-origin: center center;
        transform: rotate(${rotation}deg);
      ">
        <div class="label-content" style="
          background-color: ${backgroundColor};
          color: ${labelTextColor};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: ${isHighlighted ? 'bold' : 'normal'};
          white-space: nowrap;
          max-width: none;
          opacity: ${shouldFade ? 0.3 : isHighlighted ? 1 : 0.85};
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: ${labelBorder};
          line-height: 1.1;
          ${isFeeder ? 'font-style: italic;' : ''}
          letter-spacing: 0.01em;
          pointer-events: none;
          user-select: none;
          z-index: ${isHighlighted ? 1000 : 900};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        ">
          ${text}
        </div>
      </div>
    `,
    iconSize: [dynamicWidth, 24],
    iconAnchor: [dynamicWidth / 2, 12],
  });

  return (
    <Marker
      position={position}
      icon={labelIcon}
      interactive={false}
      zIndexOffset={isHighlighted ? 1000 : 900}
      bubblingMouseEvents={true}
    />
  );
}
