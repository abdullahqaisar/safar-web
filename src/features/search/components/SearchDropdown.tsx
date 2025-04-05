import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/formatters';
import { Loader2, Search, AlertTriangle, MapPin, History } from 'lucide-react';

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
  recentSearches?: string[];
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
  recentSearches = [],
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible && !show) return null;

  return (
    <div
      ref={dropdownRef as React.RefObject<HTMLDivElement>}
      id={`${id}-dropdown-list`}
      className={cn(
        'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden',
        'transition-all duration-200 ease-in-out',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        'scrollbar-custom'
      )}
      style={{ maxHeight: '300px', overflowY: 'auto' }}
      role="listbox"
    >
      {!isReady && (
        <div className="py-6 px-4 text-center text-gray-500">
          <div className="flex justify-center items-center">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span>Initializing...</span>
          </div>
        </div>
      )}

      {isReady && isLoading && (
        <div className="py-6 px-4 text-center text-gray-500">
          <div className="flex justify-center items-center">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span>Searching...</span>
          </div>
        </div>
      )}

      {isReady && !isLoading && status === 'ZERO_RESULTS' && (
        <div className="py-6 px-4 text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <span>No results found</span>
            <p className="text-xs text-gray-400 mt-1">
              Try a different search term
            </p>
          </div>
        </div>
      )}

      {status === 'REQUEST_DENIED' && (
        <div className="py-6 px-4 text-center text-red-500">
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span>API error: Request denied</span>
            <p className="text-xs text-gray-500 mt-1">Please try again later</p>
          </div>
        </div>
      )}

      {isReady &&
        !isLoading &&
        status === 'OK' &&
        suggestions.length === 0 &&
        recentSearches.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recent Searches
            </div>
            {recentSearches.slice(0, 3).map((search, index) => (
              <div
                key={`recent-${index}`}
                className="cursor-pointer px-4 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                onClick={() => onSelectItem(search)}
              >
                <History size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate">{search}</span>
              </div>
            ))}
          </div>
        )}

      {isReady && !isLoading && status === 'OK' && suggestions.length > 0 && (
        <div className="py-1">
          {suggestions.map(
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
                  'cursor-pointer px-4 py-3 flex items-start gap-3 transition-all duration-150',
                  highlightedIndex === index
                    ? 'bg-[rgba(var(--color-accent-rgb),0.08)] shadow-sm'
                    : 'hover:bg-[rgba(var(--color-accent-rgb),0.03)]'
                )}
                onClick={() => onSelectItem(description)}
                onMouseEnter={() => onHighlightItem(index)}
                role="option"
                aria-selected={highlightedIndex === index}
              >
                <div className="flex-shrink-0 text-accent-dark mt-0.5">
                  <MapPin
                    size={16}
                    className={cn(
                      'transition-colors',
                      highlightedIndex === index
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'font-medium truncate transition-colors',
                      highlightedIndex === index
                        ? 'text-emerald-700'
                        : 'text-gray-800'
                    )}
                  >
                    {main_text}
                    {highlightedIndex === index && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        Enter ↵
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {secondary_text}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
