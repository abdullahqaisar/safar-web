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
        <i className="fas fa-clock text-emerald-300 text-sm"></i>
        <span>{journeyDuration}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="route-info flex items-center">
          <div className="route-stops flex items-center gap-2 mr-3">
            <i className="fas fa-map-marker-alt text-emerald-300 text-xs"></i>
            <span>{stops} stops</span>
          </div>

          <div className="route-transfers flex items-center gap-2">
            <i className="fas fa-exchange-alt text-emerald-300 text-xs"></i>
            <span>
              {transfers} transfer{transfers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
