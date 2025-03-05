import { Route } from '@/types/route';

import { FareSummary } from './FareSummary';
import { RouteSegment } from './RouteSegment';
import { RouteSummary } from './RouteSummary';
import { formatDuration } from '@/lib/utils/formatters';

interface RouteCardProps {
  routes: Route[];
}

function getSegmentPosition(
  index: number,
  total: number
): 'first' | 'middle' | 'last' {
  if (index === 0) return 'first';
  if (index === total - 1) return 'last';
  return 'middle';
}

export function RouteCard({ routes }: RouteCardProps) {
  return (
    <>
      {routes.map((route, index) => (
        <div
          key={`route-${route.totalDuration}-${index}`}
          className="route-card"
        >
          <RouteSummary
            journeyDuration={formatDuration(route.totalDuration)}
            stops={route.totalStops ?? 0}
            transfers={(route.segments?.length ?? 1) - 1}
          />

          <div className="route-details">
            {route.segments.map((segment, segmentIndex) => (
              <RouteSegment
                key={segmentIndex}
                segment={segment}
                isLast={segmentIndex === route.segments.length - 1}
                position={getSegmentPosition(
                  segmentIndex,
                  route.segments.length
                )}
              />
            ))}
            <FareSummary amount={120} />
          </div>
        </div>
      ))}
    </>
  );
}
