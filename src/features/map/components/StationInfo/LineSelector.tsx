import { Layers, Train, Eye, EyeOff } from 'lucide-react';
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

  // Match map height from MapContainer
  const selectorStyle = {
    maxHeight: isTablet ? '550px' : '600px',
  };

  // Calculate how many lines are currently visible
  const visibleLineCount = visibleLines.length;
  const totalLineCount = lines.length;

  return (
    <div
      className="bg-white shadow-sm overflow-hidden rounded-xl"
      style={selectorStyle}
    >
      {/* Header */}
      <div className="p-4 bg-emerald-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-emerald-800 flex items-center">
            <Train className="h-4 w-4 mr-2 text-emerald-500" />
            Metro Lines
          </h3>
          <div className="text-xs text-emerald-700 font-medium">
            {visibleLineCount}/{totalLineCount} visible
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full">
        {/* Main content area */}
        <div className="flex-1 overflow-auto p-3">
          {/* All Lines Option */}
          <div className="mb-3">
            <button
              key="all-lines"
              className={cn(
                'w-full justify-between text-left h-auto py-2.5 px-3 rounded-md flex items-center',
                selectedLine === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100'
              )}
              onClick={() => {
                onLineSelect('');
                onShowAll();
              }}
            >
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                <span className="font-medium">All Lines</span>
              </div>
              <span className="text-xs font-normal opacity-80">
                {visibleLineCount === totalLineCount ? 'All visible' : 'Mixed'}
              </span>
            </button>
          </div>

          {/* Line divider */}
          <div className="mb-3 border-t border-gray-100"></div>

          {/* Lines List */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
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
                    className="flex-grow flex items-center focus:outline-none"
                    onClick={() => onLineSelect(line.id)}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full mr-2.5 transition-all duration-200',
                        !isVisible && 'opacity-40'
                      )}
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
                  </button>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => onToggleLineVisibility(line.id)}
                    className={cn(
                      'ml-1.5 h-7 w-7 rounded-full transition-colors flex items-center justify-center',
                      isVisible
                        ? 'text-emerald-500 hover:bg-emerald-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                    title={isVisible ? 'Hide line' : 'Show line'}
                    aria-label={isVisible ? 'Hide line' : 'Show line'}
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
                      'w-1 h-8 rounded-full transition-all duration-200 ml-1.5',
                      isSelected ? 'bg-emerald-500' : 'bg-transparent'
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs rounded-md transition-colors font-medium hover:bg-gray-50"
                onClick={onHideAll}
              >
                Hide All
              </button>
              <button
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs rounded-md transition-colors font-medium hover:bg-gray-50"
                onClick={onShowAll}
              >
                Show All
              </button>
            </div>

            <div className="text-xs text-gray-500">
              {visibleLineCount === 0
                ? 'No lines visible'
                : visibleLineCount === 1
                ? '1 line visible'
                : `${visibleLineCount} lines visible`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
