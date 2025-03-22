import { useState } from 'react';
import { Route, WalkSegment } from '@/types/route';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ArrowLeftRight,
  Share2,
  Footprints,
} from 'lucide-react';
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
              className="-ml-2"
              onClick={onBack}
              leftIcon={<ArrowLeft size={18} />}
              data-variant="ghost"
            >
              Back to routes
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                leftIcon={<Share2 size={16} />}
                data-variant="outline"
              >
                Share
              </Button>
            </div>
          </div>

          {/* Journey summary card */}
          <div className="bg-[rgba(var(--color-accent-rgb),0.1)] rounded-xl border border-[rgba(var(--color-accent-rgb),0.2)] p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[rgba(var(--color-accent-rgb),0.2)] text-[var(--color-accent)] flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatDuration(route.totalDuration)}
                  </div>
                  <div className="text-sm text-[var(--color-accent)]">
                    Total journey time
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 sm:ml-4 sm:border-l sm:border-[rgba(var(--color-accent-rgb),0.2)] sm:pl-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {route.totalStops} stops
                    </div>
                    <div className="text-xs text-[var(--color-accent)]">
                      Total stops
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {route.transfers} transfer
                      {route.transfers !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-[var(--color-accent)]">
                      Line changes
                    </div>
                  </div>
                </div>

                {totalWalkingDistance > 0 && (
                  <div className="flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-[var(--color-accent)]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDistance(totalWalkingDistance)}
                      </div>
                      <div className="text-xs text-[var(--color-accent)]">
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
