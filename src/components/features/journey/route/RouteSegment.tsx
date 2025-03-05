import { Badge } from '@/components/ui/Badge';
import { RouteSegment as RouteSegmentType } from '@/types/route';
import { formatDistance, formatDuration } from '@/lib/utils/formatters';
import { getBusColor } from '@/lib/utils/route';

interface RouteSegmentProps {
  segment: RouteSegmentType;
  isLast: boolean;
  position: 'first' | 'middle' | 'last';
}

export function RouteSegment({ segment, isLast, position }: RouteSegmentProps) {
  const getSegmentDetails = () => {
    if (segment.type === 'walk') {
      return {
        icon: 'fas fa-walking',
        iconBgColor: 'bg-blue-500',
        title:
          position === 'first'
            ? 'Walk to station'
            : position === 'last'
            ? 'Walk to destination'
            : 'Walk to next station',
        description: `${formatDuration(segment.duration)} (${formatDistance(
          segment.walkingDistance!
        )})`,
      };
    }

    let lineColor = 'bg-gray-500';
    if (segment.line) lineColor = getBusColor(segment?.line?.id);

    return {
      icon: 'fas fa-bus',
      iconBgColor: lineColor,
      title:
        position === 'first'
          ? `Take ${segment.line?.name} at ${segment.stations[0].name}`
          : `Transfer to ${segment.line?.name} at ${segment.stations[0].name}`,
      description: `${segment.stations.length - 1} stops • ${formatDuration(
        segment.duration
      )}`,
      badges: [{ text: segment.line?.name || '', color: lineColor || '' }],
    };
  };

  const details = getSegmentDetails();

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
