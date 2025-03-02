'use client';

import { MetroLine } from '@/lib/metro-data';
import { RouteSegmentProps } from '@/types/metro';

export function RouteSegment({ segment, isLast }: RouteSegmentProps) {
  return (
    <div
      className={`p-4 border-l-4 ${getBorderColorForLine(
        segment.line.id
      )} ${getBgColorForLine(segment.line.id)} rounded-md relative`}
    >
      <h3 className="font-bold text-lg">
        {isLast
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

      {!isLast && (
        <div
          className="absolute left-4 h-8 w-0.5 bg-gray-300"
          style={{ top: '100%' }}
        ></div>
      )}
    </div>
  );
}

function getBorderColorForLine(lineId: MetroLine['id']): string {
  const colors = {
    red: 'border-red-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    orange: 'border-orange-500',
  };
  return colors[lineId] || 'border-gray-500';
}

function getBgColorForLine(lineId: MetroLine['id']): string {
  const colors = {
    red: 'bg-red-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
  };
  return colors[lineId] || 'bg-gray-50';
}
