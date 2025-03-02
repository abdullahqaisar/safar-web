'use client';

import { MetroLine, Station } from '@/types/metro';
import { getBgColorForLine, getBorderColorForLine } from '@/utils/route';

interface RouteSegmentProps {
  segment: {
    line: MetroLine;
    stations: Station[];
  };
  isFirst: boolean;
}

export function RouteSegment({ segment, isFirst }: RouteSegmentProps) {
  return (
    <div
      className={`p-4 border-l-4 ${getBorderColorForLine(
        segment.line.id
      )} ${getBgColorForLine(segment.line.id)} rounded-md relative`}
    >
      <h3 className="font-bold text-lg">
        {isFirst
          ? `Board ${segment.line.name} at ${segment.stations[0].name}`
          : `Transfer to ${segment.line.name} at ${segment.stations[0].name}`}
      </h3>
      <p className="mt-2">
        Travel {segment.stations.length - 1} stop
        {segment.stations.length - 1 !== 1 ? 's' : ''} to{' '}
        {segment.stations[segment.stations.length - 1].name}
      </p>

      {segment.stations.length > 2 && (
        <p className="mt-2 text-sm text-gray-600">
          Passing through:{' '}
          {segment.stations
            .slice(1, -1)
            .map((s) => s.name)
            .join(', ')}
        </p>
      )}

      {!isFirst && (
        <div
          className="absolute left-4 h-6 w-0.5 bg-gray-300"
          style={{ bottom: '100%' }}
        ></div>
      )}
    </div>
  );
}
