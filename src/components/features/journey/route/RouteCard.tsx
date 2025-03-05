import { Route } from '@/types/route';

import { FareSummary } from './FareSummary';
import { RouteSegment } from './RouteSegment';
import { RouteSummary } from './RouteSummary';
import { formatDuration } from '@/lib/utils/formatters';

interface RouteCardProps {
  routes: Route[];
}

export function RouteCard({ routes }: RouteCardProps) {
  return (
    <>
      {routes.map((route, index) => (
        <div key={index} className="route-card">
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
                position={
                  segmentIndex === 0
                    ? 'first'
                    : segmentIndex === route.segments.length - 1
                    ? 'last'
                    : 'middle'
                }
              />
            ))}
            <FareSummary amount={120} />
          </div>
        </div>
      ))}
    </>
  );
}
