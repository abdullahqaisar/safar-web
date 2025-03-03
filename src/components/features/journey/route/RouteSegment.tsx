import Badge from '@/components/ui/Badge';

interface JourneySegmentProps {
  icon: string;
  iconBgColor: string;
  title: string;
  description: string;
  badges?: Array<{
    text: string;
    color: string;
  }>;
  isLast?: boolean;
}

export function JourneySegment({
  icon,
  iconBgColor,
  title,
  description,
  badges,
  isLast,
}: JourneySegmentProps) {
  return (
    <div className="route-segment">
      <div className={`route-icon ${iconBgColor}`}>
        <i className={icon}></i>
      </div>
      <div className="route-text flex justify-between items-start w-full">
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        {badges && (
          <div className="flex gap-2 ml-4">
            {badges.map((badge, index) => (
              <Badge
                key={index}
                text={badge.text}
                color={iconBgColor}
                className="bus-badge"
              />
            ))}
          </div>
        )}
      </div>
      {!isLast && <div className="segment-connector"></div>}
    </div>
  );
}
