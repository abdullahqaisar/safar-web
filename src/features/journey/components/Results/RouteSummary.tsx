import { Route, WalkSegment } from '@/types/route';
import { Clock, MapPin, ArrowLeftRight } from 'lucide-react';
import { formatDuration } from '../../utils';

interface RouteSummaryProps {
  route: Route;
  showFareEstimate?: boolean;
}

export function RouteSummary({
  route,
  showFareEstimate = false,
}: RouteSummaryProps) {
  // Calculate total walking distance
  const totalWalkingDistance = route.segments
    .filter((segment) => segment.type === 'walk')
    .reduce(
      (total, segment) => total + (segment as WalkSegment).walkingDistance,
      0
    );

  // Format walking distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatDuration(route.totalDuration)}
            </div>
            <div className="text-sm text-emerald-700">Total journey time</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 sm:ml-4 sm:border-l sm:border-emerald-200 sm:pl-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-medium text-gray-900">
                {route.totalStops} stops
              </div>
              <div className="text-xs text-emerald-700">Total stops</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-medium text-gray-900">
                {route.transfers} transfer{route.transfers !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-emerald-700">Line changes</div>
            </div>
          </div>

          {totalWalkingDistance > 0 && (
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M13 4C13 5.10457 12.1046 6 11 6C9.89543 6 9 5.10457 9 4C9 2.89543 9.89543 2 11 2C12.1046 2 13 2.89543 13 4Z"
                  fill="currentColor"
                />
                <path
                  d="M9.5 8H12.5L14.5 17H16V22H14V19H10V22H8V17H9.5L9.5 8Z"
                  fill="currentColor"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900">
                  {formatDistance(totalWalkingDistance)}
                </div>
                <div className="text-xs text-emerald-700">Walking distance</div>
              </div>
            </div>
          )}

          {showFareEstimate && route.fare && (
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 9C15 7.89543 13.6569 7 12 7C10.3431 7 9 7.89543 9 9C9 10.1046 10.3431 11 12 11C13.6569 11 15 11.8954 15 13C15 14.1046 13.6569 15 12 15C10.3431 15 9 14.1046 9 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 5V7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900">
                  ${route.fare.toFixed(2)}
                </div>
                <div className="text-xs text-emerald-700">Estimated fare</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
