import { TransitSegment, WalkSegment } from '@/types/route';
import { SegmentDetails } from './types';
import { getBusColor } from '@/lib/utils/route';

export function getWalkSegmentDetails(
  segment: WalkSegment,
  position: string
): SegmentDetails {
  const walkTitle =
    position === 'first'
      ? 'Walk to station'
      : position === 'last'
      ? 'Walk to destination'
      : 'Walk to next station';

  return {
    icon: 'fas fa-walking',
    iconBgColor: 'bg-blue-500',
    title: walkTitle,
    description: `${formatDuration(segment.duration)} (${formatDistance(
      segment.walkingDistance || 0
    )})`,
    lineColorClass: 'bg-blue-500',
  };
}

export function getTransitSegmentDetails(
  segment: TransitSegment,
  isFirstTransit: boolean
): SegmentDetails {
  const lineColor = segment.line
    ? getBusColor(segment.line.id || '')
    : 'bg-gray-500';
  const stationName = segment.stations[0].name;
  const lineName = segment.line?.name;
  const lastStation = segment.stations[segment.stations.length - 1];

  return {
    icon: 'fas fa-bus',
    iconBgColor: lineColor,
    title: isFirstTransit
      ? `Take ${lineName} at ${stationName}`
      : `Transfer to ${lineName} at ${stationName}`,
    description: `${segment.stations.length - 1} stops • ${formatDuration(
      segment.duration
    )}`,
    badges: [{ text: lineName || '', color: lineColor }],
    transferStation: lastStation?.name,
    lineColorClass: lineColor,
  };
}

/**
 * Formats duration from seconds to minutes
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "5 min")
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
};

/**
 * Formats distance in meters
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "500 m")
 */
export const formatDistance = (meters: number): string => {
  return `${Math.ceil(meters)} m`;
};
