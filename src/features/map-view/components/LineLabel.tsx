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
}

export default function LineLabel({
  position,
  rotation,
  color,
  text,
  isHighlighted,
  shouldFade,
}: LineLabelProps) {
  // Calculate a dynamic icon size based on text length
  // This ensures the icon can accommodate the entire text
  const textLength = text.length;
  const minWidth = 40;
  const widthPerChar = 6; // Average width per character in pixels
  const dynamicWidth = Math.max(minWidth, textLength * widthPerChar + 16); // Add padding

  // Create a color contrast for text vs background
  // Determine if the background color is light or dark to choose text color
  const isLightColor = () => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance - standard formula for perceived brightness
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  // Use white text on dark backgrounds, black text on light backgrounds
  const textColor = isLightColor() ? '#000000' : '#ffffff';

  // Create a custom icon for the label with improved containment
  const labelIcon = L.divIcon({
    className: 'metro-line-label',
    html: `
      <div class="label-container" style="
        position: relative;
        width: ${dynamicWidth}px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        transform-origin: center center;
        transform: rotate(${rotation}deg);
      ">
        <div class="label-content" style="
          background-color: ${color};
          color: ${textColor};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: ${isHighlighted ? 'bold' : 'normal'};
          white-space: nowrap;
          max-width: none;
          opacity: ${shouldFade ? 0.3 : isHighlighted ? 1 : 0.85};
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: ${isHighlighted ? '1px solid white' : 'none'};
          line-height: 1.1;
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
    iconSize: [dynamicWidth, 24], // Increase height slightly and use dynamic width
    iconAnchor: [dynamicWidth / 2, 12], // Center the icon
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
