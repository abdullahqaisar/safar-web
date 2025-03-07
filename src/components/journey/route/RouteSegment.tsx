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
  isFirstTransit?: boolean;
}

interface SegmentDetails {
  icon: string;
  iconBgColor: string;
  title: string;
  description: string;
  badges?: Array<{ text: string; color: string }>;
  transferStation?: string;
  lineColorClass?: string;
}

export function RouteSegment({
  segment,
  isLast,
  position,
  isFirstTransit = false,
}: RouteSegmentProps) {
  const details: SegmentDetails =
    segment.type === 'walk'
      ? getWalkSegmentDetails(segment as WalkSegment, position)
      : getTransitSegmentDetails(segment as TransitSegment, isFirstTransit);

  const connectorColorClass = details.lineColorClass;
  const segmentTypeClass = segment.type === 'walk' ? 'walk-segment' : '';

  return (
    <div className={`route-segment ${segmentTypeClass}`}>
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

      {!isLast && (
        <>
          {details.transferStation ? (
            <>
              <div
                className={`connector-line connector-top ${connectorColorClass} ${segmentTypeClass}`}
              ></div>

              <div className="transfer-label">
                <div className="transfer-label-content ">
                  <i className={`fas fa-sign-out-alt text-xs mr-1 `}></i>
                  <span>Exit at {details.transferStation} Station</span>
                </div>
              </div>

              <div
                className={`connector-line connector-bottom ${connectorColorClass}`}
              ></div>
            </>
          ) : (
            <div
              className={`connector-line connector-full ${connectorColorClass} ${segmentTypeClass}`}
            ></div>
          )}
        </>
      )}
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
      segment.walkingDistance || 0
    )})`,
    lineColorClass: 'bg-blue-500',
  };
}

function getTransitSegmentDetails(
  segment: TransitSegment,
  isFirstTransit: boolean
): SegmentDetails {
  const lineColor = segment.line ? getBusColor(segment.line.id) : 'bg-gray-500';
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
