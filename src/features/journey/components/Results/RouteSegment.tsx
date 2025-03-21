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

interface RouteSegmentProps {
  segment: SegmentType;
  isLast: boolean;
  position: 'first' | 'middle' | 'last';
  isExpanded?: boolean;
  onToggleExpand: () => void;
}

export function RouteSegment({
  segment,
  isLast,
  position,
  isExpanded = false,
  onToggleExpand,
}: RouteSegmentProps) {
  const getSegmentTypeStyles = () => {
    if (segment.type === 'transit') {
      return {
        bgColor: 'bg-emerald-500 text-white',
        icon: <Train className="w-5 h-5" />,
      };
    } else if (segment.type === 'walk') {
      return {
        bgColor: 'bg-gray-200 text-gray-700',
        icon: <Footprints className="w-5 h-5" />,
      };
    } else {
      return {
        bgColor: 'bg-gray-200 text-gray-700',
        icon: <Info className="w-5 h-5" />,
      };
    }
  };

  const { bgColor, icon } = getSegmentTypeStyles();
  const duration = segment.duration ? formatDuration(segment.duration) : '';

  // Determine line color for transit segments
  const getLineColor = () => {
    if (segment.type !== 'transit') return '';

    const transitSegment = segment as TransitSegment;
    const lineName = transitSegment.line?.name || '';

    if (lineName.toLowerCase().includes('green')) {
      return 'bg-green-100 text-green-800';
    } else if (lineName.toLowerCase().includes('blue')) {
      return 'bg-blue-100 text-blue-800';
    } else if (lineName.toLowerCase().includes('red')) {
      return 'bg-red-100 text-red-800';
    } else if (lineName.toLowerCase().includes('orange')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Get description based on segment type
  const getDescription = () => {
    if (segment.type === 'transit') {
      const transitSegment = segment as TransitSegment;
      return `Take ${transitSegment.line?.name || 'transit'}`;
    } else if (segment.type === 'walk') {
      const walkSegment = segment as WalkSegment;
      // Get destination station name
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
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${bgColor}`}
          >
            {icon}
          </div>
          {!isLast && (
            <div
              className="absolute top-10 left-5 bottom-0 w-0.5 bg-gray-200"
              style={{ height: 'calc(100% + 2rem)' }}
            ></div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <p className="font-medium text-base text-gray-900">
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
                      <span className="mx-2"></span>
                      <Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" />
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
                          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          {segment.stations.length - 1} stops
                        </span>
                      </div>
                    )}

                    {duration && (
                      <div
                        className="flex items-center text-sm text-gray-600"
                        title="Duration"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                        {duration}
                      </div>
                    )}
                  </div>

                  {segment.stations && segment.stations.length > 1 && (
                    <button
                      className="mt-1 inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-700 rounded-md transition-colors"
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
                      />
                    </button>
                  )}
                </div>
              )}
            </div>
            {segment.type === 'transit' && (
              <span
                className={`ml-2 px-2.5 py-0.5 text-xs rounded-full ${getLineColor()}`}
              >
                {(segment as TransitSegment).line?.name || ''}
              </span>
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
                <div className="mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
                  {segment.stations.map((station, idx) => (
                    <div key={idx} className="flex items-center py-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          idx === 0
                            ? 'bg-green-500'
                            : idx === segment.stations.length - 1
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        } mr-2.5 flex-shrink-0`}
                      ></div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          className={`text-sm ${
                            idx === 0
                              ? 'text-green-600 font-medium'
                              : idx === segment.stations.length - 1
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {station.name}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-md font-medium border border-green-100">
                            Board
                          </span>
                        )}
                        {idx === segment.stations.length - 1 && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] rounded-md font-medium border border-red-100">
                            Exit
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
