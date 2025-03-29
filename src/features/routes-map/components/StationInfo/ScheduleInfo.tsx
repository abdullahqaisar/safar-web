import { Clock } from 'lucide-react';

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
          <Clock className="w-4 h-4 mr-2 text-primary" />
          Schedule
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-md">
            <span className="text-sm text-gray-500">Frequency:</span>
            <span className="font-normal text-gray-800 text-right">
              {frequency}
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-md">
            <span className="text-sm text-gray-500">Hours:</span>
            <span className="font-normal text-gray-800 text-right">
              {firstTrain} - {lastTrain}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 h-full">
      <h4 className="text-sm font-medium mb-3 flex items-center text-gray-800">
        <Clock className="w-4 h-4 mr-2 text-primary" />
        Schedule Information
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <span className="text-sm text-gray-500">Frequency:</span>
          <span className="font-normal text-gray-800 text-right">
            {frequency}
          </span>
        </div>
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <span className="text-sm text-gray-500">Operating Hours:</span>
          <span className="font-medium text-sm text-gray-800 text-right">
            {firstTrain} - {lastTrain}
          </span>
        </div>
      </div>
    </div>
  );
}
