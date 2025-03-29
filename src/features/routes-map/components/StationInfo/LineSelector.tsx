import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TransitLine } from '@/core/types/graph';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <h3 className="text-sm font-medium mb-3 text-gray-700">Transit Lines</h3>

      <div className="relative">
        {/* Left scroll button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-md hover:bg-gray-50 text-gray-700"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right scroll button */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-md hover:bg-gray-50 text-gray-700"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-2 px-1 pb-2 scrollbar-hide"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Lines option */}
          <Button
            size="sm"
            variant={!selectedLine ? 'default' : 'outline'}
            className={
              !selectedLine
                ? 'bg-primary text-white hover:bg-primary/90 whitespace-nowrap'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50 whitespace-nowrap'
            }
            onClick={() => onLineSelect('')}
          >
            All Lines
          </Button>

          {/* Individual line options */}
          {lines.map((line) => (
            <Button
              key={line.id}
              size="sm"
              variant={selectedLine === line.id ? 'default' : 'outline'}
              className={`
                whitespace-nowrap
                ${
                  selectedLine === line.id
                    ? 'text-white'
                    : 'text-gray-700 border-gray-200'
                }
                transition-colors
              `}
              style={{
                backgroundColor:
                  selectedLine === line.id ? line.color : 'transparent',
                borderColor: selectedLine === line.id ? line.color : undefined,
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
