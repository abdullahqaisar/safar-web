import {
  RouteSegment as SegmentType,
  TransitSegment,
  WalkSegment,
} from '@/types/route';
import {
  Train,
  Info,
  MapPin,
  Clock,
  ChevronDown,
  Footprints,
} from 'lucide-react';
import { formatDuration } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/formatters';

interface RouteSegmentProps {
  segment: SegmentType;
  isLast: boolean;
  position: 'first' | 'middle' | 'last';
  isExpanded?: boolean;
  onToggleExpand: () => void;
  isTransfer?: boolean;
  segmentIndex: number;
  isLastTransitSegment?: boolean; // New prop to identify last transit segment
}

export function RouteSegment({
  segment,
  isLast,
  position,
  isExpanded = false,
  onToggleExpand,
  isTransfer = false,
  segmentIndex,
  isLastTransitSegment = false, // Default to false
}: RouteSegmentProps) {
  const getSegmentTypeStyles = () => {
    if (segment.type === 'transit') {
      return {
        bgColor: 'bg-[color:var(--color-accent)] text-white',
        icon: <Train className="w-5 h-5" aria-hidden="true" />,
      };
    } else if (segment.type === 'walk') {
      return {
        bgColor: 'bg-gray-200 text-gray-700',
        icon: <Footprints className="w-5 h-5" aria-hidden="true" />,
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
      return 'bg-[rgba(var(--color-accent-rgb),0.1)] text-[color:var(--color-accent)] border border-[rgba(var(--color-accent-rgb),0.2)]';
    } else if (lineName.toLowerCase().includes('blue')) {
      return 'bg-blue-50 text-blue-700 border border-blue-100';
    } else if (lineName.toLowerCase().includes('red')) {
      return 'bg-red-50 text-red-700 border border-red-100';
    } else if (lineName.toLowerCase().includes('orange')) {
      return 'bg-orange-50 text-orange-700 border border-orange-100';
    } else if (lineName.toLowerCase().includes('feeder')) {
      return 'bg-[rgba(var(--color-primary-rgb),0.1)] text-[color:var(--color-primary)] border border-[rgba(var(--color-primary-rgb),0.2)]';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
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
                    isTransfer && 'text-[color:var(--color-accent-dark)]'
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
                        className="w-3.5 h-3.5 mr-1 text-[color:var(--color-accent)]"
                        aria-hidden="true"
                      />
                      <span>{duration}</span>
                    </>
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
                            className="w-3.5 h-3.5 mr-1 text-[color:var(--color-accent)]"
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
                          className="w-3.5 h-3.5 mr-1 text-[color:var(--color-accent)]"
                          aria-hidden="true"
                        />
                        {duration}
                      </div>
                    )}
                  </div>

                  {segment.stations && segment.stations.length > 1 && (
                    <button
                      className="mt-2 inline-flex items-center text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-dark)] hover:bg-[rgba(var(--color-accent-rgb),0.05)] active:bg-[rgba(var(--color-accent-rgb),0.1)] py-1 px-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
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
                <div className="mt-3 ml-1 pl-3 border-l-2 border-[rgba(var(--color-accent-rgb),0.15)] space-y-1">
                  {segment.stations.map((station, idx) => {
                    const isOrigin = idx === 0;
                    const isDestination = idx === segment.stations.length - 1;

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
                              ? 'bg-[color:var(--color-accent)]'
                              : isDestination
                              ? 'bg-[color:var(--color-primary)]'
                              : 'bg-gray-300'
                          } mr-2.5 flex-shrink-0`}
                          aria-hidden="true"
                        ></div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span
                            className={`text-sm ${
                              isOrigin
                                ? 'text-[color:var(--color-accent)] font-medium'
                                : isDestination
                                ? 'text-[color:var(--color-primary)] font-medium'
                                : 'text-gray-500'
                            }`}
                          >
                            {station.name}
                          </span>
                          {isOrigin && (
                            <span
                              className="px-1.5 py-0.5 bg-[rgba(var(--color-accent-rgb),0.1)] text-[color:var(--color-accent)] text-[10px] rounded-md font-medium border border-[rgba(var(--color-accent-rgb),0.2)]"
                              aria-label={
                                isTransfer ? 'Transfer point' : 'Board here'
                              }
                            >
                              {stationLabel}
                            </span>
                          )}
                          {isDestination && (
                            <span
                              className="px-1.5 py-0.5 bg-[rgba(var(--color-primary-rgb),0.1)] text-[color:var(--color-primary)] text-[10px] rounded-md font-medium border border-[rgba(var(--color-primary-rgb),0.2)]"
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
