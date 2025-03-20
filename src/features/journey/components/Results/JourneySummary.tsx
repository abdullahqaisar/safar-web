import { Clock, MapPin, ArrowLeftRight } from 'lucide-react';

interface RouteSummaryProps {
  journeyDuration: string;
  stops: number;
  transfers: number;
  isSelected?: boolean;
}

export function JourneySummary({
  journeyDuration,
  stops,
  transfers,
  isSelected = false,
}: RouteSummaryProps) {
  return (
    <div className={`route-header ${isSelected ? 'selected' : ''}`}>
      <div className="route-time flex items-center gap-2">
        <Clock className="text-emerald-300" size={16} />
        <span>{journeyDuration}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="route-info flex items-center">
          <div className="route-stops flex items-center gap-2 mr-3">
            <MapPin className="text-emerald-300" size={14} />
            <span>{stops} stops</span>
          </div>

          <div className="route-transfers flex items-center gap-2">
            <ArrowLeftRight className="text-emerald-300" size={14} />
            <span>
              {transfers} transfer{transfers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
