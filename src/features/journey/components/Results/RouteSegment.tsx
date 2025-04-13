import {
  RouteSegment as SegmentType,
  TransitRouteSegment as TransitSegment,
  WalkingRouteSegment as WalkSegment,
} from '@/core/types/route';
import {
  Train,
  Info,
  MapPin,
  Clock,
  ChevronDown,
  Footprints,
  Bus,
  ExternalLink,
} from 'lucide-react';
import { formatDuration } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/formatters';

// Extended segment type to include access segments
interface AccessSegment {
  type: 'access';
  accessType: 'origin' | 'destination';
  recommendation: {
    type: 'walk' | 'public_transport';
    distance: number;
    googleMapsUrl?: string;
  };
  duration: number;
  stations: {
    id: string;
    name: string;
    coordinates?: { lat: number; lng: number };
  }[];
}

interface RouteSegmentProps {
  segment: SegmentType | AccessSegment;
  isLast: boolean;
  position: 'first' | 'middle' | 'last';
  isExpanded?: boolean;
  onToggleExpand: () => void;
  isTransfer?: boolean;
  segmentIndex: number;
  isLastTransitSegment?: boolean;
}

export function RouteSegment({
  segment,
  isLast,
  position,
  isExpanded = false,
  onToggleExpand,
  isTransfer = false,
  segmentIndex,
  isLastTransitSegment = false,
}: RouteSegmentProps) {
  const getSegmentTypeStyles = () => {
    if (segment.type === 'transit') {
      return {
        bgColor: 'bg-emerald-600 text-white',
        icon: <Train className="w-5 h-5" aria-hidden="true" />,
      };
    } else if (segment.type === 'walk') {
      return {
        bgColor: 'bg-gray-200 text-gray-700',
        icon: <Footprints className="w-5 h-5" aria-hidden="true" />,
      };
    } else if (segment.type === 'access') {
      const accessSegment = segment as AccessSegment;
      const isWalk = accessSegment.recommendation.type === 'walk';

      return {
        bgColor: isWalk
          ? 'bg-[rgba(var(--color-accent-rgb),0.15)] text-[var(--color-accent)]'
          : 'bg-gray-200 text-gray-700',
        icon: isWalk ? (
          <Footprints className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Bus className="w-5 h-5" aria-hidden="true" />
        ),
      };
    } else {
      return {
        bgColor: 'bg-gray-200 text-gray-700',
        icon: <Info className="w-5 h-5" aria-hidden="true" />,
      };
    }
  };

  const { bgColor, icon } = getSegmentTypeStyles();
  const duration = segment.duration ? formatDuration(segment.duration) : '';

  const getLineColor = () => {
    if (segment.type !== 'transit') return '';

    const transitSegment = segment as TransitSegment;
    const lineName = transitSegment.line?.name || '';

    if (lineName.toLowerCase().includes('green')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (lineName.toLowerCase().includes('blue')) {
      return 'bg-blue-50 text-blue-700 border border-blue-100';
    } else if (lineName.toLowerCase().includes('red')) {
      return 'bg-red-50 text-red-700 border border-red-100';
    } else if (lineName.toLowerCase().includes('orange')) {
      return 'bg-orange-50 text-orange-700 border border-orange-100';
    } else if (
      lineName.toLowerCase().includes('fr-') ||
      lineName.toLowerCase().includes('fr_')
    ) {
      // Use a brighter teal that better differentiates from blue
      return 'bg-cyan-50 text-cyan-500 border border-cyan-200';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  // Format distance for access segments
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Get description based on segment type and position
  const getDescription = () => {
    if (segment.type === 'transit') {
      const transitSegment = segment as TransitSegment;
      const lineName = transitSegment.line?.name || 'transit';
      const originStation = transitSegment.stations?.[0]?.name || '';

      if (isTransfer) {
        return `Transfer to ${lineName}${
          originStation ? ` at ${originStation}` : ''
        }`;
      } else if (segmentIndex === 0) {
        return `Board ${lineName}${
          originStation ? ` at ${originStation}` : ''
        }`;
      } else {
        return `Take ${lineName}${originStation ? ` at ${originStation}` : ''}`;
      }
    } else if (segment.type === 'walk') {
      const walkSegment = segment as WalkSegment;
      const destinationStation =
        walkSegment.stations[walkSegment.stations.length - 1];
      return `Walk to ${destinationStation?.name || 'next stop'}`;
    } else if (segment.type === 'access') {
      const accessSegment = segment as AccessSegment;
      const isWalk = accessSegment.recommendation.type === 'walk';
      const distance = formatDistance(accessSegment.recommendation.distance);

      // Get the actual station and location names
      const stationName =
        accessSegment.accessType === 'origin'
          ? accessSegment.stations[1]?.name
          : accessSegment.stations[0]?.name;

      const locationName =
        accessSegment.accessType === 'origin'
          ? 'starting point'
          : 'destination';

      // Create base description text
      let description = '';
      if (accessSegment.accessType === 'origin') {
        description = isWalk
          ? `Walk ${distance} from ${locationName} to ${stationName}`
          : `Take public transport ${distance} from ${locationName} to ${stationName}`;
      } else {
        description = isWalk
          ? `Walk ${distance} from ${stationName} to ${locationName}`
          : `Take public transport ${distance} from ${stationName} to ${locationName}`;
      }

      return (
        <>
          {description}
          {accessSegment.recommendation.googleMapsUrl && (
            <a
              href={accessSegment.recommendation.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[var(--color-accent)] ml-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs mr-1">Open in Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </>
      );
    }
    return 'Continue your journey';
  };

  return (
    <div className="py-4 sm:py-5">
      <div className="flex">
        <div className="mr-4 relative">
          <div
            className={cn(
              `w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${bgColor}`
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
          {!isLast && (
            <div
              className="absolute top-10 left-5 bottom-0 w-0.5 bg-gray-200"
              style={{ height: 'calc(100% + 2rem)' }}
              aria-hidden="true"
            ></div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center">
                <p
                  className={cn(
                    'font-medium text-base text-gray-900',
                    isTransfer && 'text-emerald-700'
                  )}
                >
                  {getDescription()}
                </p>
              </div>

              {/* Walking details */}
              {segment.type === 'walk' && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <span>
                    {Math.round((segment as WalkSegment).walkingDistance)}{' '}
                    meters
                  </span>
                  {duration && (
                    <>
                      <span className="mx-2 text-gray-300" aria-hidden="true">
                        •
                      </span>
                      <Clock
                        className="w-3.5 h-3.5 mr-1 text-emerald-500"
                        aria-hidden="true"
                      />
                      <span>{duration}</span>
                    </>
                  )}
                </div>
              )}

              {/* Access segment details */}
              {segment.type === 'access' && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  {duration && (
                    <div className="flex items-center">
                      <Clock
                        className="w-3.5 h-3.5 mr-1 text-[var(--color-accent)]"
                        aria-hidden="true"
                      />
                      <span>Approximately {duration}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Transit details */}
              {segment.type === 'transit' && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-3">
                    {segment.stations && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 flex items-center">
                          <MapPin
                            className="w-3.5 h-3.5 mr-1 text-emerald-500"
                            aria-hidden="true"
                          />
                          {segment.stations.length - 1} stops
                        </span>
                      </div>
                    )}

                    {duration && (
                      <div
                        className="flex items-center text-sm text-gray-600"
                        title="Duration"
                      >
                        <span
                          className="mx-1 text-gray-300 hidden sm:inline"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <Clock
                          className="w-3.5 h-3.5 mr-1 text-emerald-500"
                          aria-hidden="true"
                        />
                        {duration}
                      </div>
                    )}
                  </div>

                  {segment.stations && segment.stations.length > 1 && (
                    <button
                      className="mt-2 inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 py-1 px-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand();
                      }}
                      aria-expanded={isExpanded}
                      aria-controls={`stations-list-${segment.type}-${position}`}
                    >
                      {isExpanded ? 'Hide stations' : 'View stations'}
                      <ChevronDown
                        className={`w-3.5 h-3.5 ml-1 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              )}
            </div>
            {segment.type === 'transit' && (
              <div className="mt-2 sm:mt-0 sm:ml-2 flex-shrink-0">
                <span
                  className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full max-w-[140px] truncate ${getLineColor()}`}
                  title={(segment as TransitSegment).line?.name || ''}
                >
                  {(segment as TransitSegment).line?.name || ''}
                </span>
              </div>
            )}
          </div>

          {/* Expandable stations list */}
          <AnimatePresence>
            {isExpanded && segment.stations && (
              <motion.div
                id={`stations-list-${segment.type}-${position}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 ml-1 pl-3 border-l-2 border-emerald-100 space-y-1">
                  {segment.stations.map((station, idx) => {
                    const isOrigin = idx === 0;
                    const isDestination = idx === segment.stations.length - 1;

                    // For access segments, use special labels
                    if (segment.type === 'access') {
                      const accessSegment = segment as AccessSegment;
                      const isOriginSegment =
                        accessSegment.accessType === 'origin';

                      // For origin access segments: first = starting point, second = station
                      // For destination access segments: first = station, second = destination
                      const isStartingPoint = isOriginSegment && isOrigin;
                      const isEndPoint = !isOriginSegment && isDestination;

                      let stationLabel = '';
                      let badgeColor = '';

                      if (isStartingPoint) {
                        stationLabel = 'Starting Point';
                        badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                      } else if (isEndPoint) {
                        stationLabel = 'Destination';
                        badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                      } else if (isOriginSegment && isDestination) {
                        stationLabel = station.name;
                        badgeColor =
                          'bg-emerald-50 text-emerald-600 border-emerald-200';
                      } else if (!isOriginSegment && isOrigin) {
                        stationLabel = station.name;
                        badgeColor = 'bg-red-50 text-red-600 border-red-100';
                      }

                      return (
                        <div key={idx} className="flex items-center py-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isStartingPoint || isOrigin
                                ? 'bg-emerald-500'
                                : isEndPoint || isDestination
                                  ? 'bg-red-500'
                                  : 'bg-gray-300'
                            } mr-2.5 flex-shrink-0`}
                            aria-hidden="true"
                          ></div>
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span
                              className={`text-sm ${
                                isStartingPoint || isOrigin
                                  ? 'text-emerald-600 font-medium'
                                  : isEndPoint || isDestination
                                    ? 'text-red-600 font-medium'
                                    : 'text-gray-500'
                              }`}
                            >
                              {station.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded-md font-medium border ${badgeColor}`}
                            >
                              {stationLabel}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Determine station label based on position and context
                    const stationLabel = isOrigin
                      ? 'Origin'
                      : isDestination
                        ? isLast
                          ? 'Destination'
                          : 'Transfer point'
                        : 'Stop';

                    // Determine what text to show for destination badges
                    const getDestinationLabel = () => {
                      if (isLastTransitSegment && isDestination) {
                        return 'Exit'; // Always show "Exit" for last station of last transit segment
                      } else if (isLast) {
                        return 'Arrive'; // For the last station in the very last segment
                      } else {
                        return 'Transfer'; // For transfer points
                      }
                    };

                    return (
                      <div key={idx} className="flex items-center py-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isOrigin
                              ? 'bg-emerald-500'
                              : isDestination
                                ? 'bg-red-500'
                                : 'bg-gray-300'
                          } mr-2.5 flex-shrink-0`}
                          aria-hidden="true"
                        ></div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span
                            className={`text-sm ${
                              isOrigin
                                ? 'text-emerald-600 font-medium'
                                : isDestination
                                  ? 'text-red-600 font-medium'
                                  : 'text-gray-500'
                            }`}
                          >
                            {station.name}
                          </span>
                          {isOrigin && (
                            <span
                              className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded-md font-medium border border-emerald-200"
                              aria-label={
                                isTransfer ? 'Transfer point' : 'Board here'
                              }
                            >
                              {stationLabel}
                            </span>
                          )}
                          {isDestination && (
                            <span
                              className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] rounded-md font-medium border border-red-100"
                              aria-label={
                                isLastTransitSegment
                                  ? 'Exit here'
                                  : isLast
                                    ? 'Arrive here'
                                    : 'Transfer here'
                              }
                            >
                              {getDestinationLabel()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
