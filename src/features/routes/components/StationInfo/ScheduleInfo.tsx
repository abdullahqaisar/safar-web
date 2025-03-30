import React from 'react';
import { Clock } from 'lucide-react';

interface ScheduleType {
  firstTrain?: string;
  lastTrain?: string;
  frequency?: string;
}

interface ScheduleInfoProps {
  schedule: ScheduleType;
  compact?: boolean;
}

export default function ScheduleInfo({
  schedule,
  compact = false,
}: ScheduleInfoProps) {
  const {
    firstTrain = '6:00',
    lastTrain = '23:00',
    frequency = 'Every 10 minutes',
  } = schedule;

  return (
    <div className={compact ? 'bg-gray-50 rounded-lg p-2.5' : 'space-y-2'}>
      <div
        className={
          compact
            ? 'text-xs text-gray-500 mb-1'
            : 'text-sm font-medium text-gray-700 flex items-center'
        }
      >
        {!compact && (
          <Clock className="w-4 h-4 text-[color:var(--color-accent)] mr-1.5" />
        )}
        {compact ? 'Schedule' : 'Operating Hours'}
      </div>

      {compact ? (
        <div className="font-medium">
          {firstTrain} - {lastTrain}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500">First Train</div>
          <div className="text-gray-900 font-medium">{firstTrain}</div>
          <div className="text-gray-500">Last Train</div>
          <div className="text-gray-900 font-medium">{lastTrain}</div>
          <div className="text-gray-500">Frequency</div>
          <div className="text-gray-900 font-medium">{frequency}</div>
        </div>
      )}
    </div>
  );
}
