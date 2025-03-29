import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TransitLine } from '@/core/types/graph';
import { ChevronLeft, ChevronRight, Train } from 'lucide-react';

interface LineSelectorProps {
  lines: TransitLine[];
  selectedLine: string | null;
  onLineSelect: (lineId: string) => void;
}

export default function LineSelector({
  lines,
  selectedLine,
  onLineSelect,
}: LineSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; // Adjust as needed
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left:
          direction === 'left'
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-medium mb-3 flex items-center text-gray-700">
        <Train className="w-4 h-4 mr-2 text-emerald-500" />
        Transit Lines
      </h3>

      <div className="relative">
        {/* Left scroll button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 text-gray-700 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Right scroll button */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 text-gray-700 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-2 px-1 py-1 scrollbar-hide"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Lines option */}
          <Button
            size="sm"
            variant="ghost"
            className={`
              whitespace-nowrap rounded-full px-4 transition-all border
              ${
                !selectedLine
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-transparent'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
              }
            `}
            onClick={() => onLineSelect('')}
          >
            All Lines
          </Button>

          {/* Individual line options */}
          {lines.map((line) => (
            <Button
              key={line.id}
              size="sm"
              variant="ghost"
              className={`
                whitespace-nowrap rounded-full px-4 transition-all border
                ${
                  selectedLine === line.id
                    ? 'text-white border-transparent hover:opacity-90'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                }
              `}
              style={{
                backgroundColor:
                  selectedLine === line.id ? line.color : undefined,
              }}
              onClick={() => onLineSelect(line.id)}
            >
              {line.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
