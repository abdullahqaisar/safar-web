interface RouteSummaryProps {
  departureTime: string;
  stops: number;
  transfers: number;
}

export function RouteSummary({
  departureTime,
  stops,
  transfers,
}: RouteSummaryProps) {
  return (
    <div className="route-header">
      <div className="route-time">{departureTime}</div>
      <div className="flex items-center gap-3">
        <div className="route-duration">
          {stops} stops • {transfers} transfer{transfers !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
