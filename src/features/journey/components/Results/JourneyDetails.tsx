import { useState, useEffect } from 'react';
import { Route, WalkSegment, TransitSegment } from '@/types/route';
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

  // Track previous transit line to detect transfers
  const [transferSegments, setTransferSegments] = useState<
    Record<number, boolean>
  >({});

  // Find the index of the last transit segment
  const [lastTransitSegmentIndex, setLastTransitSegmentIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    // Detect which segments are transfers (change of transit line)
    const transfers: Record<number, boolean> = {};
    let previousTransitLine: string | null = null;

    route.segments.forEach((segment, index) => {
      if (segment.type === 'transit') {
        const transitSegment = segment as TransitSegment;
        const currentLine = transitSegment.line?.name || '';

        // If we have a previous transit line and it's different from current, mark as transfer
        if (
          previousTransitLine !== null &&
          previousTransitLine !== currentLine
        ) {
          transfers[index] = true;
        }

        previousTransitLine = currentLine;
      } else {
        // If this is a walk segment after a transit segment,
        // we're potentially preparing for a transfer, but don't reset the line
      }
    });

    setTransferSegments(transfers);

    // Find the last transit segment in the route
    for (let i = route.segments.length - 1; i >= 0; i--) {
      if (route.segments[i].type === 'transit') {
        setLastTransitSegmentIndex(i);
        break;
      }
    }
  }, [route.segments]);

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
          text: `Journey taking ${formatDuration(route.totalDuration)} with ${
            route.totalStops
          } stops.`,
          url: window.location.href,
        })
        .catch((error) => console.log('Sharing failed', error));
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((error) => console.error('Failed to copy', error));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6">
          {/* Header with back button and actions */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <Button
              variant="ghost"
              className="-ml-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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
                className="flex items-center gap-1.5 py-2 px-3 text-xs bg-white border-emerald-500 text-emerald-600 hover:bg-gray-50 hover:border-emerald-600"
                aria-label="Share journey"
              >
                <Share2 size={13} />
                <span className="pl-2">Share Journey</span>
              </Button>
            </div>
          </div>

          {/* Journey summary card */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatDuration(route.totalDuration)}
                  </div>
                  <div className="text-sm text-emerald-600">
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
                    <div className="text-xs text-emerald-600">Total stops</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {route.transfers} transfer
                      {route.transfers !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-emerald-600">Line changes</div>
                  </div>
                </div>

                {totalWalkingDistance > 0 && (
                  <div className="flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDistance(totalWalkingDistance)}
                      </div>
                      <div className="text-xs text-emerald-600">
                        Walking distance
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden">
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
                    isTransfer={transferSegments[index] || false}
                    segmentIndex={index}
                    isLastTransitSegment={index === lastTransitSegmentIndex}
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
