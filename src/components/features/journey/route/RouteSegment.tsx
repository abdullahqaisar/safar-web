import { Badge } from '@/components/ui/Badge';
import {
  RouteSegment as RouteSegmentType,
  TransitSegment,
  WalkSegment,
} from '@/types/route';
import { formatDistance, formatDuration } from '@/lib/utils/formatters';
import { getBusColor } from '@/lib/utils/route';

interface RouteSegmentProps {
  segment: RouteSegmentType;
  isLast: boolean;
  position: 'first' | 'middle' | 'last';
}

interface SegmentDetails {
  icon: string;
  iconBgColor: string;
  title: string;
  description: string;
  badges?: Array<{ text: string; color: string }>;
}

export function RouteSegment({ segment, isLast, position }: RouteSegmentProps) {
  const details: SegmentDetails =
    segment.type === 'walk'
      ? getWalkSegmentDetails(segment as WalkSegment, position)
      : getTransitSegmentDetails(segment as TransitSegment, position);

  return (
    <div className="route-segment">
      <div className={`route-icon ${details.iconBgColor}`}>
        <i className={details.icon}></i>
      </div>
      <div className="route-text flex justify-between items-start w-full">
        <div>
          <h4>{details.title}</h4>
          <p>{details.description}</p>
        </div>
        {details.badges && (
          <div className="flex gap-2 ml-4">
            {details.badges.map((badge, index) => (
              <Badge key={index} text={badge.text} color={badge.color} />
            ))}
          </div>
        )}
      </div>
      {!isLast && <div className="segment-connector"></div>}
    </div>
  );
}

function getWalkSegmentDetails(
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
      segment.walkingDistance!
    )})`,
  };
}

function getTransitSegmentDetails(
  segment: TransitSegment,
  position: string
): SegmentDetails {
  const lineColor = segment.line ? getBusColor(segment.line.id) : 'bg-gray-500';
  const stationName = segment.stations[0].name;
  const lineName = segment.line?.name;

  return {
    icon: 'fas fa-bus',
    iconBgColor: lineColor,
    title:
      position === 'first'
        ? `Take ${lineName} at ${stationName}`
        : `Transfer to ${lineName} at ${stationName}`,
    description: `${segment.stations.length - 1} stops • ${formatDuration(
      segment.duration
    )}`,
    badges: [{ text: lineName || '', color: lineColor }],
  };
}
