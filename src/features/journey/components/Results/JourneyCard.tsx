import {
  Route,
  TransitRouteSegment as TransitSegment,
} from '@/core/types/route';
import {
  Clock,
  MapPin,
  ArrowLeftRight,
  ChevronRight,
  Footprints,
  Star,
  Wallet,
} from 'lucide-react';
import { formatDuration } from '../../utils';
import { Button } from '@/components/common/Button';
import { AccessRecommendations } from '@/core/types/route';

interface JourneyCardProps {
  route: Route;
  onSelect: () => void;
  isRecommended?: boolean;
  accessRecommendations?: AccessRecommendations;
}

export function JourneyCard({
  route,
  onSelect,
  isRecommended = false,
}: JourneyCardProps) {
  // Get transit segments for line badges
  const transitSegments = route.segments.filter(
    (segment): segment is TransitSegment => segment.type === 'transit'
  );

  // Format walking segments for display
  const totalWalkingTime = route.segments
    .filter((segment) => segment.type === 'walk')
    .reduce((total, segment) => total + segment.duration, 0);

  // Format fare for display
  const formatFare = (fare: number) => {
    return `Rs ${fare.toFixed(0)}`;
  };

  return (
    <div
      className="bg-white border border-gray-200 hover:border-[rgba(var(--color-accent-rgb),0.4)] hover:shadow-md transition-all rounded-xl overflow-hidden hover-lift focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-2 relative"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
          e.preventDefault();
        }
      }}
      aria-label={`Journey taking ${formatDuration(route.totalDuration)} with ${
        route.totalStops
      } stops and ${route.transfers} transfers${
        isRecommended ? ', recommended route' : ''
      }`}
    >
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-[var(--color-accent)] text-white py-1 px-3 rounded-bl-lg rounded-tr-lg flex items-center gap-1 shadow-sm z-10">
          <Star className="w-3.5 h-3.5 fill-white" />
          <span className="text-xs font-medium">Recommended</span>
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[rgba(var(--color-accent-rgb),0.1)] text-[var(--color-accent)]">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-medium text-lg sm:text-xl text-gray-900">
                {formatDuration(route.totalDuration)}
              </span>
              <p className="text-xs text-gray-500">Total journey time</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-3 py-3 border-t border-b border-gray-100 mb-4">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-[var(--color-accent)] mr-1.5" />
            <span className="text-xs sm:text-sm text-gray-700">
              {route.totalStops || 0} stops
            </span>
          </div>
          <div className="flex items-center">
            <ArrowLeftRight className="w-4 h-4 text-[var(--color-accent)] mr-1.5" />
            <span className="text-xs sm:text-sm text-gray-700">
              {route.transfers || 0} transfer{route.transfers !== 1 ? 's' : ''}
            </span>
          </div>

          {totalWalkingTime > 0 && (
            <div className="flex items-center">
              <Footprints className="w-4 h-4 text-[var(--color-accent)] mr-1.5" />
              <span className="text-xs sm:text-sm text-gray-700">
                {formatDuration(totalWalkingTime)} walking
              </span>
            </div>
          )}

          {route.totalFare && route.totalFare > 0 && (
            <div className="flex items-center">
              <Wallet className="w-4 h-4 text-[var(--color-accent)] mr-1.5" />
              <span className="text-xs sm:text-sm text-gray-700">
                {formatFare(route.totalFare)}
              </span>
            </div>
          )}
        </div>

        {transitSegments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {transitSegments.map((segment, idx) => {
              const lineName = segment.line?.name || '';
              const lineColorClass = lineName.toLowerCase().includes('green')
                ? 'bg-green-100 text-green-800'
                : lineName.toLowerCase().includes('blue')
                  ? 'bg-blue-100 text-blue-800'
                  : lineName.toLowerCase().includes('red')
                    ? 'bg-red-100 text-red-800'
                    : lineName.toLowerCase().includes('orange')
                      ? 'bg-orange-100 text-orange-800'
                      : lineName.toLowerCase().includes('fr-') ||
                          lineName.toLowerCase().includes('fr_')
                        ? 'bg-cyan-100 text-cyan-600' // Updated to a brighter, more distinctive teal
                        : 'bg-gray-100 text-gray-800';

              return (
                <div
                  key={idx}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${lineColorClass}`}
                >
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6.4C4 5.07452 5.07452 4 6.4 4H17.6C18.9255 4 20 5.07452 20 6.4V17.6C20 18.9255 18.9255 20 17.6 20H6.4C5.07452 20 4 18.9255 4 17.6V6.4Z"
                      fill="currentColor"
                    />
                    <path
                      d="M9 10C9 8.89543 9.89543 8 11 8H13C14.1046 8 15 8.89543 15 10V14H9V10Z"
                      fill="white"
                    />
                    <path
                      d="M8 16C8 16.5523 8.44772 17 9 17C9.55228 17 10 16.5523 10 16C10 15.4477 9.55228 15 9 15C8.44772 15 8 15.4477 8 16Z"
                      fill="white"
                    />
                    <path
                      d="M14 16C14 16.5523 14.4477 17 15 17C15.5523 17 16 16.5523 16 16C16 15.4477 15.5523 15 15 15C14.4477 15 14 15.4477 14 16Z"
                      fill="white"
                    />
                  </svg>
                  {lineName || 'Transit Line'}
                </div>
              );
            })}
          </div>
        )}

        <Button
          className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] active:scale-[0.98] text-white rounded-md flex items-center justify-center gap-2 group"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          data-variant="primary"
        >
          View Journey Details
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
