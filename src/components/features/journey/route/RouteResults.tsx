'use client';

import { Route } from '@/types/metro';

import { FareSummary } from './FareSummary';
import { RouteSegment } from './RouteSegment';
import { RouteSummary } from './RouteSummary';
import { formatDuration } from '@/utils/formatters';

interface RouteResultsProps {
  route: Route;
}

export function RouteResults({ route }: RouteResultsProps) {
  return (
    <div className="route-results bg-white rounded-b-2xl">
      <div className="results-header">
        <div>
          <h3 className="font-bold text-lg">Suggested Routes</h3>
          <p className="text-sm text-gray-500">1 route found</p>
        </div>
      </div>

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
    </div>
  );
}
