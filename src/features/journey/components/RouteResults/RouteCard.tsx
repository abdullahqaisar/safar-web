import { Route } from '@/types/route';

import { RouteSegment } from './RouteSegment';
import { JourneySummary } from '../JourneyPlanner/JourneySummary';
import { formatDuration } from '../../utils';

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
      {routes.map((route, index) => {
        const firstTransitIndex = route.segments.findIndex(
          (segment) => segment.type === 'transit'
        );

        return (
          <div
            key={`route-${route.totalDuration}-${index}`}
            className="route-card group"
          >
            <JourneySummary
              journeyDuration={formatDuration(route.totalDuration)}
              stops={route.totalStops ?? 0}
              transfers={route.transfers ?? 0}
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
                  isFirstTransit={
                    segment.type === 'transit' &&
                    segmentIndex === firstTransitIndex
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
