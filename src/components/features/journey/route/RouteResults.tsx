'use client';

import { Route } from '@/types/metro';

import { FareSummary } from './FareSummary';
import { getBusColor } from '@/utils/route';
import { JourneySegment } from './RouteSegment';
import { RouteSummary } from './RouteSummary';

interface RouteResultsProps {
  route: Route;
}

export function RouteResults({ route }: RouteResultsProps) {
  return (
    <div className="route-results">
      <div className="results-header">
        <div>
          <h3 className="font-bold text-lg">Suggested Routes</h3>
          <p className="text-sm text-gray-500">1 route found</p>
        </div>
      </div>

      <div className="route-card">
        <RouteSummary
          departureTime="Departs in 5 min"
          stops={route.totalStops}
          transfers={route.segments.length - 1}
        />

        <div className="route-details">
          {route.segments.map((segment, index) => (
            <div key={index} className="space-y-6">
              <JourneySegment
                icon="fas fa-bus"
                iconBgColor={getBusColor(segment.line.id)}
                title={
                  index === 0
                    ? `Take ${segment.line.name} at ${segment.stations[0].name}`
                    : `Transfer to ${segment.line.name} at ${segment.stations[0].name}`
                }
                description={`${segment.stations.length - 1} stops • ${
                  (segment.stations.length - 1) * 3
                } min`}
                badges={[
                  {
                    text: segment.line.name,
                    color: getBusColor(segment.line.id),
                  },
                ]}
                isLast={
                  index === route.segments.length - 1 &&
                  !route.segments[index + 1]
                }
              />
              {index < route.segments.length - 1 && (
                <JourneySegment
                  icon="fas fa-walking"
                  iconBgColor="bg-blue-500"
                  title="Walk to next station"
                  description="5 min (300m)"
                  isLast={false}
                />
              )}
            </div>
          ))}

          <FareSummary amount={120} />
        </div>
      </div>
    </div>
  );
}
