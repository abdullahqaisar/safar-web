import {
  ChevronRight,
  Layers,
  Train,
  Eye,
  Route as RouteIcon,
} from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import { cn } from '@/lib/utils/formatters';

interface LineSelectorProps {
  lines: TransitLine[];
  selectedLine: string | null;
  visibleLines: string[];
  onLineSelect: (lineId: string) => void;
  onToggleLineVisibility: (lineId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export default function LineSelector({
  lines,
  selectedLine,
  visibleLines,
  onLineSelect,
  onToggleLineVisibility,
  onShowAll,
  onHideAll,
}: LineSelectorProps) {
  // Check if multiple lines are visible
  const multipleVisibleLines = visibleLines.length > 1;

  // Handle line selection with enhanced UX
  const handleLineSelect = (lineId: string) => {
    // If selecting a specific line (not "All Lines")
    if (lineId) {
      // Check if this is a new selection
      const isNewSelection = selectedLine !== lineId;

      // Select the line
      onLineSelect(lineId);

      // If this is a new selection, ensure the line is visible
      if (isNewSelection && !visibleLines.includes(lineId)) {
        onToggleLineVisibility(lineId);
      }
    } else {
      // For "All Lines" selection
      onLineSelect('');
      onShowAll();
    }
  };

  // Handle visibility toggle with enhanced UX
  const handleVisibilityToggle = (lineId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the parent button click

    // Toggle the visibility
    onToggleLineVisibility(lineId);

    // If we're making this line visible and no line is currently selected,
    // also select this line
    if (!visibleLines.includes(lineId) && selectedLine === null) {
      onLineSelect(lineId);
    }

    // If we're hiding the currently selected line, go back to all lines
    if (visibleLines.includes(lineId) && selectedLine === lineId) {
      onLineSelect('');
    }
  };

  return (
    <div className="bg-white shadow-sm overflow-hidden rounded-xl">
      <div className="p-4 bg-emerald-50 border-b border-gray-100">
        <h3 className="font-semibold text-emerald-800 flex items-center">
          <Train className="h-4 w-4 mr-2 text-emerald-500" />
          Metro Lines
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {/* All Lines Option */}
        <div className="p-3">
          <button
            key="all-lines"
            className={cn(
              'w-full justify-start text-left font-medium h-auto py-2.5 px-3 rounded-md flex items-center',
              selectedLine === null
                ? 'bg-emerald-600 text-white'
                : 'hover:bg-gray-100'
            )}
            onClick={() => {
              onLineSelect('');
              onShowAll(); // Show all lines when "All Lines" is selected
            }}
          >
            <Layers className="h-4 w-4 mr-2" />
            <span>All Lines</span>
          </button>
        </div>

        {/* Line Options with Visibility Toggles */}
        <div className="p-3">
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center mb-1">
                <button
                  className={cn(
                    'flex-grow justify-start text-left font-medium h-auto py-2.5 px-3 rounded-md flex items-center',
                    selectedLine === line.id
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-gray-100'
                  )}
                  onClick={() => handleLineSelect(line.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: line.color }}
                  ></div>
                  <span className="truncate">{line.name}</span>
                  <ChevronRight
                    className={cn(
                      'ml-auto h-4 w-4 transition-transform duration-200 flex-shrink-0',
                      selectedLine === line.id && 'transform rotate-90'
                    )}
                  />
                </button>
                <button
                  className={cn(
                    'ml-2 h-8 w-8 p-0 rounded flex items-center justify-center transition-colors shrink-0',
                    visibleLines.includes(line.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 border border-gray-200 text-gray-400 hover:bg-gray-200'
                  )}
                  onClick={(e) => handleVisibilityToggle(line.id, e)}
                  title={
                    visibleLines.includes(line.id) ? 'Hide line' : 'Show line'
                  }
                  aria-label={
                    visibleLines.includes(line.id) ? 'Hide line' : 'Show line'
                  }
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Show/Hide All Buttons */}
        <div className="p-3 bg-gray-50">
          <div className="flex justify-between">
            <button
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md transition-colors font-medium"
              onClick={onHideAll}
            >
              Hide All
            </button>
            <button
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md transition-colors font-medium"
              onClick={onShowAll}
            >
              Show All
            </button>
          </div>
        </div>

        {/* Line Selection Prompt Card (shown when all lines or multiple lines are selected) */}
        {(selectedLine === null || multipleVisibleLines) && (
          <div className="p-3 bg-gray-50">
            <div className="bg-white border border-gray-100 rounded-md p-3 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <RouteIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-800 mb-1">
                Select a Line
              </h4>
              <p className="text-xs text-gray-500 mb-0">
                Select a metro line to view its details and stations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
