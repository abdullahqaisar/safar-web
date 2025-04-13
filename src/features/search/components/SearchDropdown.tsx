import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/formatters';
import {
  Loader2,
  Search,
  AlertTriangle,
  MapPin,
  History,
  Bus,
  ArrowRight,
} from 'lucide-react';
import { getLineColor } from '@/lib/utils/route';

interface StationDetails {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  lines?: string[];
  lineNames?: string[];
}

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  isStation?: boolean;
  station?: StationDetails;
}

interface SearchDropdownProps {
  id: string;
  show: boolean;
  isReady: boolean;
  isLoading: boolean;
  status: string;
  suggestions: Suggestion[];
  highlightedIndex: number;
  onSelectItem: (description: string, index?: number) => void;
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

  // Group suggestions by type - stations first, then places
  const stationSuggestions = suggestions.filter(
    (suggestion) => suggestion.isStation
  );
  const placeSuggestions = suggestions.filter(
    (suggestion) => !suggestion.isStation
  );

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
      style={{ maxHeight: '350px', overflowY: 'auto' }}
      role="listbox"
    >
      {!isReady && (
        <div className="py-6 px-4 text-center text-gray-500">
          <div className="flex flex-col justify-center items-center gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">Initializing search...</span>
          </div>
        </div>
      )}

      {isReady && isLoading && (
        <div className="py-6 px-4 text-center text-gray-500">
          <div className="flex flex-col justify-center items-center gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">
              Finding stops and places...
            </span>
          </div>
        </div>
      )}

      {isReady && !isLoading && status === 'ZERO_RESULTS' && (
        <div className="py-6 px-4 text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <Search size={22} className="text-gray-400" />
            <span className="text-sm font-medium">No results found</span>
            <p className="text-xs text-gray-400 mt-1">
              Try a different search term or different spelling
            </p>
          </div>
        </div>
      )}

      {status === 'REQUEST_DENIED' && (
        <div className="py-6 px-4 text-center text-red-500">
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle size={22} className="text-red-500" />
            <span className="text-sm font-medium">
              API error: Request denied
            </span>
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
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
              Recent Searches
            </div>
            {recentSearches.slice(0, 3).map((search, index) => (
              <div
                key={`recent-${index}`}
                className="cursor-pointer px-3 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                onClick={() => onSelectItem(search, -1)}
              >
                <div className="flex-shrink-0 bg-gray-100 rounded-full p-1.5">
                  <History size={14} className="text-gray-500" />
                </div>
                <span className="text-gray-700 truncate">{search}</span>
              </div>
            ))}
          </div>
        )}

      {isReady && !isLoading && status === 'OK' && suggestions.length > 0 && (
        <div>
          {/* Show station results first with a section title */}
          {stationSuggestions.length > 0 && (
            <div className="transit-stops">
              <div className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-100 sticky top-0">
                Transit Stops
              </div>
              {stationSuggestions.map((suggestion) => {
                // Find the overall index in the combined suggestions array
                const overallIndex = suggestions.findIndex(
                  (s) => s.place_id === suggestion.place_id
                );
                const {
                  place_id,
                  description,
                  structured_formatting: { main_text },
                  station,
                } = suggestion;

                // Get all lines for this stop
                const lines = station?.lines || [];
                const lineNames = station?.lineNames || [];

                const isHighlighted = highlightedIndex === overallIndex;

                return (
                  <div
                    key={place_id}
                    id={`${id}-item-${overallIndex}`}
                    className={cn(
                      'cursor-pointer px-3 py-3 flex items-start gap-2 transition-all duration-150 border-l-3',
                      isHighlighted
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'hover:bg-gray-50 border-transparent'
                    )}
                    onClick={() => onSelectItem(description, overallIndex)}
                    onMouseEnter={() => onHighlightItem(overallIndex)}
                    role="option"
                    aria-selected={isHighlighted}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 rounded-full p-1.5 mt-0.5',
                        isHighlighted ? 'bg-emerald-100' : 'bg-gray-100'
                      )}
                    >
                      <Bus
                        size={14}
                        className={cn(
                          'transition-colors',
                          isHighlighted ? 'text-emerald-600' : 'text-gray-500'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <div
                          className={cn(
                            'font-medium truncate transition-colors',
                            isHighlighted ? 'text-emerald-700' : 'text-gray-800'
                          )}
                        >
                          {main_text}
                        </div>
                        <div className="inline-flex text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                          Bus Stop
                        </div>
                      </div>

                      {/* Routes/Lines that serve this stop */}
                      {lines.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {lines.map((line, index) => (
                            <div key={line} className="flex items-center">
                              <span
                                className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                                style={{
                                  backgroundColor: getLineColor(line),
                                }}
                                title={lineNames[index] || line}
                              >
                                {lineNames[index] ||
                                  line.replace('_', '-').toUpperCase()}
                              </span>
                            </div>
                          ))}
                          {lines.length > 3 && (
                            <span className="text-xs text-gray-500 px-1 font-medium">
                              ({lines.length} routes total)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Select indicator */}
                    {isHighlighted && (
                      <div className="flex-shrink-0 self-center">
                        <ArrowRight size={14} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show place results */}
          {placeSuggestions.length > 0 && (
            <div className="places">
              {stationSuggestions.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-100 sticky top-0">
                  Places
                </div>
              )}
              {placeSuggestions.map((suggestion) => {
                // Find the overall index in the combined suggestions array
                const overallIndex = suggestions.findIndex(
                  (s) => s.place_id === suggestion.place_id
                );
                const {
                  place_id,
                  description,
                  structured_formatting: { main_text, secondary_text },
                } = suggestion;

                const isHighlighted = highlightedIndex === overallIndex;

                return (
                  <div
                    key={place_id}
                    id={`${id}-item-${overallIndex}`}
                    className={cn(
                      'cursor-pointer px-3 py-3 flex items-start gap-2 transition-all duration-150 border-l-3',
                      isHighlighted
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'hover:bg-gray-50 border-transparent'
                    )}
                    onClick={() => onSelectItem(description, overallIndex)}
                    onMouseEnter={() => onHighlightItem(overallIndex)}
                    role="option"
                    aria-selected={isHighlighted}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 rounded-full p-1.5 mt-0.5',
                        isHighlighted ? 'bg-blue-100' : 'bg-gray-100'
                      )}
                    >
                      <MapPin
                        size={14}
                        className={cn(
                          'transition-colors',
                          isHighlighted ? 'text-blue-600' : 'text-gray-500'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'font-medium truncate transition-colors',
                          isHighlighted ? 'text-blue-700' : 'text-gray-800'
                        )}
                      >
                        {main_text}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {secondary_text}
                      </div>
                    </div>

                    {/* Select indicator */}
                    {isHighlighted && (
                      <div className="flex-shrink-0 self-center">
                        <ArrowRight size={14} className="text-blue-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
