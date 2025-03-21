import { useState } from 'react';
import { Route, WalkSegment } from '@/types/route';
import { ArrowLeft, Clock, MapPin, ArrowLeftRight, Share2 } from 'lucide-react';
import { RouteSegment } from './RouteSegment';
import { Button } from '@/components/common/Button';
import { formatDuration } from '../../utils';

interface JourneyDetailsProps {
  route: Route;
  onBack: () => void;
}

export function JourneyDetails({ route, onBack }: JourneyDetailsProps) {
  const [expandedStations, setExpandedStations] = useState<
    Record<string, boolean>
  >({});

  const toggleStationsList = (segmentIndex: number) => {
    setExpandedStations((prev) => ({
      ...prev,
      [`${route.id || 'route'}-${segmentIndex}`]:
        !prev[`${route.id || 'route'}-${segmentIndex}`],
    }));
  };

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

  // Handle share button click
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'My Journey with Safar',
          text: `Journey from X to Y taking ${formatDuration(
            route.totalDuration
          )} with ${route.totalStops} stops.`,
          url: window.location.href,
        })
        .catch((error) => console.log('Sharing failed', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((error) => console.error('Failed to copy', error));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6">
          {/* Header with back button and actions */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 -ml-2"
              onClick={onBack}
              leftIcon={<ArrowLeft size={18} />}
            >
              Back to routes
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
                onClick={handleShare}
                leftIcon={<Share2 size={16} />}
              >
                Share
              </Button>
            </div>
          </div>

          {/* Journey summary card */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatDuration(route.totalDuration)}
                  </div>
                  <div className="text-sm text-emerald-700">
                    Total journey time
                  </div>
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
                      {route.transfers} transfer
                      {route.transfers !== 1 ? 's' : ''}
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
                      <div className="text-xs text-emerald-700">
                        Walking distance
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className=" overflow-hidden">
              {route.segments.map((segment, index) => (
                <div key={index}>
                  <RouteSegment
                    segment={segment}
                    isLast={index === route.segments.length - 1}
                    position={
                      index === 0
                        ? 'first'
                        : index === route.segments.length - 1
                        ? 'last'
                        : 'middle'
                    }
                    isExpanded={
                      expandedStations[`${route.id || 'route'}-${index}`] ||
                      false
                    }
                    onToggleExpand={() => toggleStationsList(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
