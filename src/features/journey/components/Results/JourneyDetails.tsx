import { useState, useEffect, useMemo } from 'react';
import {
  Route,
  WalkingRouteSegment as WalkSegment,
  TransitRouteSegment as TransitSegment,
  AccessRecommendation,
} from '@/core/types/route';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ArrowLeftRight,
  Share2,
  Footprints,
  Star,
  Info,
  Map,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { RouteSegment } from './RouteSegment';
import { Button } from '@/components/common/Button';
import { formatDuration } from '../../utils';
import Link from 'next/link';

interface JourneyDetailsProps {
  route: Route;
  onBack: () => void;
  isRecommended?: boolean;
  accessRecommendations?: {
    origin: AccessRecommendation;
    destination: AccessRecommendation;
  };
}

// Define a virtual access segment type extending the route segment interface
interface AccessSegment {
  type: 'access';
  accessType: 'origin' | 'destination';
  recommendation: AccessRecommendation;
  duration: number; // Estimated duration based on distance
  stations: {
    id: string;
    name: string;
    coordinates?: { lat: number; lng: number };
  }[];
}

export function JourneyDetails({
  route,
  onBack,
  isRecommended = false,
  accessRecommendations,
}: JourneyDetailsProps) {
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

  // Create a combined segments array including access segments
  const allSegments = useMemo(() => {
    if (!accessRecommendations) return route.segments;

    const segments = [...route.segments];

    // Only add origin access segment if there's a valid recommendation
    if (accessRecommendations.origin) {
      // Calculate duration based on type (walk vs public transport)
      const speed =
        accessRecommendations.origin.type === 'walk'
          ? 80 // 80 meters per minute walking pace
          : 333; // 333 meters per minute (~20 km/h) for public transport

      // Create origin access segment
      const originSegment: AccessSegment = {
        type: 'access',
        accessType: 'origin',
        recommendation: {
          ...accessRecommendations.origin,
          googleMapsUrl: accessRecommendations.origin.googleMapsUrl,
        },
        // Estimate duration based on type
        duration:
          Math.round(accessRecommendations.origin.distance / speed) * 60,
        stations: [
          { id: 'origin', name: 'Your Starting Point' },
          {
            id: route.segments[0]?.stations[0]?.id || 'first-station',
            name: route.segments[0]?.stations[0]?.name || 'Station',
          },
        ],
      };

      // Insert at beginning
      segments.unshift(originSegment as unknown as (typeof segments)[0]);
    }

    // Only add destination access segment if there's a valid recommendation
    if (accessRecommendations.destination) {
      // Calculate duration based on type (walk vs public transport)
      const speed =
        accessRecommendations.destination.type === 'walk'
          ? 80 // 80 meters per minute walking pace
          : 333; // 333 meters per minute (~20 km/h) for public transport

      // Create destination access segment
      const lastSegment = route.segments[route.segments.length - 1];
      const lastStation =
        lastSegment?.stations?.[lastSegment.stations.length - 1];

      const destinationSegment: AccessSegment = {
        type: 'access',
        accessType: 'destination',
        recommendation: {
          ...accessRecommendations.destination,
          googleMapsUrl: accessRecommendations.destination.googleMapsUrl,
        },
        // Estimate duration based on type
        duration:
          Math.round(accessRecommendations.destination.distance / speed) * 60,
        stations: [
          {
            id: lastStation?.id || 'last-station',
            name: lastStation?.name || 'Station',
          },
          { id: 'destination', name: 'Your Destination' },
        ],
      };

      // Insert at end
      segments.push(destinationSegment as unknown as (typeof segments)[0]);
    }

    return segments;
  }, [route.segments, accessRecommendations]);

  useEffect(() => {
    // Detect which segments are transfers (change of transit line)
    const transfers: Record<number, boolean> = {};
    let previousTransitLine: string | null = null;

    allSegments.forEach((segment, index) => {
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
    for (let i = allSegments.length - 1; i >= 0; i--) {
      if (allSegments[i].type === 'transit') {
        setLastTransitSegmentIndex(i);
        break;
      }
    }
  }, [allSegments]);

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

  // Format fare for display
  const formatFare = (fare: number) => {
    return `Rs ${fare.toFixed(0)}`;
  };

  // Handle share button click
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'My Journey with Safar',
          text: `Journey taking ${formatDuration(route.totalDuration)} with ${
            route.totalStops
          } stops${route.totalFare ? ` and costing ${formatFare(route.totalFare)}` : ''}.`,
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
        <div className="p-4 sm:p-5">
          {/* Header with back button and actions */}
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
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
                className="flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-gray-50 hover:border-[var(--color-accent-dark)]"
                aria-label="Share journey"
              >
                <Share2 size={13} />
                <span className="pl-1">Share</span>
              </Button>
            </div>
          </div>

          {/* Journey Info Banner */}
          <div className="mb-5 bg-blue-50 rounded-lg border border-blue-100 p-3 text-xs text-blue-800">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-1">
                  <strong>Note:</strong> Times shown do not include station
                  access time or waiting time between connections.
                </p>
                <div className="flex items-center">
                  <Link
                    href="/map"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Map className="w-3.5 h-3.5 mr-1" />
                    View detailed timings, fares, and headways on the map
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Journey summary card */}
          <div className="bg-[rgba(var(--color-accent-rgb),0.05)] rounded-xl border border-[rgba(var(--color-accent-rgb),0.2)] p-3.5 mb-5 relative">
            {isRecommended && (
              <div className="absolute top-0 right-0 bg-[var(--color-accent)] text-white py-0.5 px-2 rounded-bl-lg rounded-tr-lg flex items-center gap-1 shadow-sm z-10">
                <Star className="w-3 h-3 fill-white" />
                <span className="text-xs font-medium">Recommended</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgba(var(--color-accent-rgb),0.1)] text-[var(--color-accent)] flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatDuration(route.totalDuration)}
                  </div>
                  <div className="text-xs text-[var(--color-accent)]">
                    Total journey time
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 sm:ml-3 sm:border-l sm:border-[rgba(var(--color-accent-rgb),0.2)] sm:pl-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-accent-rgb),0.1)] text-[var(--color-accent)] flex items-center justify-center">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {route.totalStops} stops
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-accent-rgb),0.1)] text-[var(--color-accent)] flex items-center justify-center">
                    <ArrowLeftRight className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {route.transfers} transfer
                      {route.transfers !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {totalWalkingDistance > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-accent-rgb),0.1)] text-[var(--color-accent)] flex items-center justify-center">
                      <Footprints className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {formatDistance(totalWalkingDistance)}
                      </div>
                    </div>
                  </div>
                )}

                {route.totalFare && route.totalFare > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-accent-rgb),0.1)] text-[var(--color-accent)] flex items-center justify-center">
                      <Wallet className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {formatFare(route.totalFare)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden">
              {allSegments.map((segment, index) => (
                <div key={index}>
                  <RouteSegment
                    segment={segment}
                    isLast={index === allSegments.length - 1}
                    position={
                      index === 0
                        ? 'first'
                        : index === allSegments.length - 1
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
