import React from 'react';
import { cn } from '@/lib/utils/formatters';
import { Loader2, Search, AlertTriangle } from 'lucide-react';

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface SearchDropdownProps {
  id: string;
  show: boolean;
  isReady: boolean;
  isLoading: boolean;
  status: string;
  suggestions: Suggestion[];
  highlightedIndex: number;
  onSelectItem: (description: string) => void;
  onHighlightItem: (index: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  id,
  show,
  isReady,
  isLoading,
  status,
  suggestions,
  highlightedIndex,
  onSelectItem,
  onHighlightItem,
  dropdownRef,
}) => {
  if (!show) return null;

  return (
    <div
      ref={dropdownRef as React.RefObject<HTMLDivElement>}
      id={`${id}-dropdown-list`}
      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
      style={{ maxHeight: '300px', overflowY: 'auto' }}
      role="listbox"
    >
      {!isReady && (
        <div className="py-4 px-4 text-center text-gray-500">
          <div className="flex justify-center items-center">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span>Initializing...</span>
          </div>
        </div>
      )}

      {isReady && isLoading && (
        <div className="py-4 px-4 text-center text-gray-500">
          <div className="flex justify-center items-center">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span>Searching...</span>
          </div>
        </div>
      )}

      {isReady && !isLoading && status === 'ZERO_RESULTS' && (
        <div className="py-4 px-4 text-center text-gray-500">
          <Search size={16} className="inline mr-2" />
          <span>No results found</span>
        </div>
      )}

      {status === 'REQUEST_DENIED' && (
        <div className="py-4 px-4 text-center text-red-500">
          <AlertTriangle size={16} className="inline mr-2" />
          <span>API error: Request denied</span>
        </div>
      )}

      {isReady &&
        !isLoading &&
        status === 'OK' &&
        suggestions.map(
          (
            {
              place_id,
              description,
              structured_formatting: { main_text, secondary_text },
            },
            index
          ) => (
            <div
              key={place_id}
              id={`${id}-item-${index}`}
              className={cn(
                'cursor-pointer px-4 py-3 border-b border-gray-100 last:border-0 transition-colors duration-150',
                highlightedIndex === index
                  ? 'bg-[rgba(var(--color-accent-rgb),0.05)]'
                  : 'hover:bg-[rgba(var(--color-accent-rgb),0.02)]'
              )}
              onClick={() => onSelectItem(description)}
              onMouseEnter={() => onHighlightItem(index)}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              <div className="font-medium text-gray-800">{main_text}</div>
              <div className="text-xs text-gray-500">{secondary_text}</div>
            </div>
          )
        )}
    </div>
  );
};

export default SearchDropdown;
