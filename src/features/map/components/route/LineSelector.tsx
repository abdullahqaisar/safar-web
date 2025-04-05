import { Layers, Train, Eye, EyeOff, Filter } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import { cn } from '@/lib/utils/formatters';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  // Calculate how many lines are currently visible
  const visibleLineCount = visibleLines.length;
  const totalLineCount = lines.length;

  // Calculate visibility status text
  const getVisibilityStatus = () => {
    if (visibleLineCount === 0) return 'All hidden';
    if (visibleLineCount === totalLineCount) return 'All visible';
    return `${visibleLineCount}/${totalLineCount} visible`;
  };

  const handleSelectAll = () => {
    onLineSelect('');
    onShowAll();
  };

  return (
    <div
      className="bg-white shadow-sm rounded-xl flex flex-col h-full"
      style={{
        height: isTablet ? '550px' : '600px',
      }}
    >
      {/* Header */}
      <div className="p-4 bg-emerald-50 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-emerald-800 flex items-center">
            <Train className="h-4 w-4 mr-2 text-emerald-500" />
            Metro Lines
          </h3>
          <div className="text-xs text-emerald-700 font-medium">
            {getVisibilityStatus()}
          </div>
        </div>
      </div>

      {/* Main content with single scrollable area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Scrollable content */}
        <div className="p-3 overflow-y-auto flex-1">
          {/* All Lines Option */}
          <div className="mb-3">
            <button
              className={cn(
                'w-full justify-between text-left h-auto py-2.5 px-3 rounded-md flex items-center',
                selectedLine === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100'
              )}
              onClick={handleSelectAll}
              aria-label="View all lines"
            >
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                <span className="font-medium">All Lines</span>
              </div>
            </button>
          </div>

          {/* Line divider */}
          <div className="mb-3 border-t border-gray-100"></div>

          {/* Filter info */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center text-xs text-gray-500">
              <Filter className="h-3 w-3 mr-1 text-emerald-500" />
              <span>Filter by line</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium">
              {selectedLine ? '1 selected' : 'None selected'}
            </div>
          </div>

          {/* Lines List */}
          <div className="space-y-1.5">
            {lines.map((line) => {
              const isVisible = visibleLines.includes(line.id);
              const isSelected = selectedLine === line.id;

              return (
                <div
                  key={line.id}
                  className={cn(
                    'group flex items-center mb-2 rounded-md pl-3 pr-1.5 py-1.5 hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-emerald-50'
                  )}
                >
                  {/* Color indicator and name */}
                  <button
                    className="flex-grow flex items-center focus:outline-none min-w-0"
                    onClick={() => onLineSelect(line.id)}
                    aria-label={`Select ${line.name}`}
                    aria-pressed={isSelected}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2.5 transition-all duration-200 flex-shrink-0"
                      style={{ backgroundColor: line.color }}
                    ></div>
                    <span
                      className={cn(
                        'truncate text-sm font-medium transition-colors duration-200',
                        isSelected && 'text-emerald-700',
                        !isVisible && 'text-gray-400'
                      )}
                    >
                      {line.name}
                    </span>

                    {/* Selected indicator for screen readers */}
                    {isSelected && <span className="sr-only">(Selected)</span>}
                  </button>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => onToggleLineVisibility(line.id)}
                    className={cn(
                      'ml-1.5 h-7 w-7 rounded-full transition-colors flex items-center justify-center flex-shrink-0',
                      isVisible
                        ? 'text-emerald-500 hover:bg-emerald-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                    title={
                      isVisible ? `Hide ${line.name}` : `Show ${line.name}`
                    }
                    aria-label={
                      isVisible ? `Hide ${line.name}` : `Show ${line.name}`
                    }
                    aria-pressed={isVisible}
                  >
                    {isVisible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Selection indicator */}
                  <div
                    className={cn(
                      'w-1 h-8 rounded-full transition-all duration-200 ml-1.5 flex-shrink-0',
                      isSelected ? 'bg-emerald-500' : 'bg-transparent'
                    )}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs rounded-md transition-colors font-medium hover:bg-gray-50"
                onClick={onHideAll}
                aria-label="Hide all lines"
              >
                Hide All
              </button>
              <button
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs rounded-md transition-colors font-medium hover:bg-gray-50"
                onClick={onShowAll}
                aria-label="Show all lines"
              >
                Show All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
