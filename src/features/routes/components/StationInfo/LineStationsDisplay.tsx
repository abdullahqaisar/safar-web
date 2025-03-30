import { TransitLine } from '@/core/types/graph';
import { Info } from 'lucide-react';
import StationList from './StationList';

interface LineStationsDisplayProps {
  line: TransitLine;
  onStationSelect: (stationId: string | null) => void;
  compactMode?: boolean;
}

export default function LineStationsDisplay({
  line,
  onStationSelect,
  compactMode = false,
}: LineStationsDisplayProps) {
  // Removed expanded state as we no longer need it

  if (!line || !line.stations || line.stations.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        No station information available.
      </div>
    );
  }

  const lineColor = line.color || '#4A5568';

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Static header - no longer clickable */}
      <div className="w-full flex items-center p-3 border-b border-gray-100 bg-white">
        <div className="flex items-center text-gray-900 font-medium">
          <Info className="w-4 h-4 text-[color:var(--color-accent)] mr-2" />
          All Stations ({line.stations.length})
        </div>
      </div>

      {/* Always visible station list with fixed height */}
      <div className="flex-1 overflow-hidden" style={{ height: '400px' }}>
        <StationList
          stations={line.stations}
          lineId={line.id}
          lineColor={lineColor}
          onStationSelect={onStationSelect}
          maxHeight="100%"
        />
      </div>
    </div>
  );
}
