'use client';

import { Route } from '@/types/metro';

import { FareSummary } from './FareSummary';
import { RouteSegment } from './RouteSegment';
import { RouteSummary } from './RouteSummary';
import { formatDuration } from '@/utils/formatters';

interface RouteCardProps {
  route: Route;
}

export function RouteCard({ route }: RouteCardProps) {
  return (
    <div className="route-card">
      <RouteSummary
        journeyDuration={formatDuration(route.totalDuration)}
        stops={route.totalStops ?? 0}
        transfers={(route.segments?.length ?? 1) - 1}
      />

      <div className="route-details">
        {route.segments.map((segment, index) => (
          <RouteSegment
            key={index}
            segment={segment}
            isLast={index === route.segments.length - 1}
            position={
              index === 0
                ? 'first'
                : index === route.segments.length - 1
                ? 'last'
                : 'middle'
            }
          />
        ))}
        <FareSummary amount={120} />
      </div>
    </div>
  );
}
