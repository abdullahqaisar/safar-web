import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { TransitLine } from '@/core/types/graph';
import { cn } from '@/lib/utils/formatters';

interface MobileLineSelectorProps {
  metroLines: TransitLine[];
  selectedLineId: string | null;
  onSelectLine: (lineId: string) => void;
}

const MobileLineSelector: React.FC<MobileLineSelectorProps> = ({
  metroLines,
  selectedLineId,
  onSelectLine,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLineSelect = (lineId: string) => {
    onSelectLine(lineId);
    setIsOpen(false);
  };

  const selectedLine = selectedLineId
    ? metroLines.find((line) => line.id === selectedLineId)
    : null;

  return (
    <div className="relative md:hidden mb-4">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
        aria-expanded={isOpen}
        aria-controls="mobile-line-dropdown"
      >
        <div className="flex items-center">
          {selectedLine ? (
            <>
              <div
                className="w-5 h-5 rounded-full mr-2"
                style={{ backgroundColor: selectedLine.color }}
              ></div>
              <span className="font-medium">{selectedLine.name}</span>
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 mr-2" />
              <span className="text-gray-700">All Lines</span>
            </>
          )}
        </div>
        <div
          className={cn(
            'w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center',
            isOpen && 'bg-gray-200'
          )}
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          id="mobile-line-dropdown"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-md z-50 max-h-[300px] overflow-y-auto"
        >
          <div className="p-2">
            <button
              onClick={() => handleLineSelect('')}
              className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors flex items-center"
            >
              <Layers className="h-4 w-4 mr-2" />

              <span className="text-gray-700">All Lines</span>
            </button>

            {metroLines.map((line) => (
              <button
                key={line.id}
                onClick={() => handleLineSelect(line.id)}
                className={cn(
                  'w-full flex items-center text-left p-3 rounded-md transition-colors',
                  selectedLineId === line.id
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                )}
              >
                <div
                  className="w-5 h-5 rounded-full mr-2"
                  style={{ backgroundColor: line.color }}
                ></div>
                <span>{line.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLineSelector;
