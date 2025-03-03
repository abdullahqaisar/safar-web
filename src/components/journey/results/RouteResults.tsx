'use client';

import { Route } from '@/types/metro';
import { RouteSegment } from './RouteSegment';

interface RouteResultsProps {
  route: Route;
}

export function RouteResults({ route }: RouteResultsProps) {
  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-2xl font-bold mb-4">Recommended Route</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="font-bold">
          {route.segments.length > 1
            ? `${route.segments.length - 1} transfer${
                route.segments.length > 2 ? 's' : ''
              } required`
            : 'Direct route'}
        </div>
        <div>
          Total journey: {route.totalStops} stop
          {route.totalStops !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-6">
        {route.segments.map((segment, index) => (
          <RouteSegment
            key={`segment-${index}`}
            segment={segment}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
