import { Clock, AlarmClock, Timer } from 'lucide-react';

interface ScheduleInfoProps {
  frequency: string;
  firstTrain: string;
  lastTrain: string;
  isMobile?: boolean;
}

export default function ScheduleInfo({
  frequency,
  firstTrain,
  lastTrain,
  isMobile = false,
}: ScheduleInfoProps) {
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h4 className="text-sm font-medium mb-3 flex items-center text-gray-800">
          <Clock className="w-4 h-4 mr-2 text-emerald-500" />
          Schedule
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-md">
            <Timer className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-gray-600">Frequency:</span>
              <span className="font-medium text-sm text-gray-800">
                {frequency}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-md">
            <AlarmClock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-gray-600">Hours:</span>
              <span className="font-medium text-sm text-gray-800">
                {firstTrain} - {lastTrain}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 h-full">
      <h4 className="text-sm font-medium mb-3 flex items-center text-gray-800">
        <Clock className="w-4 h-4 mr-2 text-emerald-500" />
        Schedule Information
      </h4>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <div className="flex-shrink-0 bg-white p-1.5 rounded-md shadow-sm">
            <Timer className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Frequency</span>
            <span className="font-medium text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {frequency}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <div className="flex-shrink-0 bg-white p-1.5 rounded-md shadow-sm">
            <AlarmClock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Operating Hours
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                {firstTrain}
              </span>
              <span className="text-gray-500">-</span>
              <span className="font-medium text-sm text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                {lastTrain}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
