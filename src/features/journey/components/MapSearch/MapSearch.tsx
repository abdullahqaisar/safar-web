'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Coordinates } from '@/types/station';
import { cn } from '@/lib/utils/formatters';

interface MapSearchProps {
  id: string;
  onSelectPlace: (location: Coordinates | null) => void;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  icon: string;
  lightMode?: boolean;
}

export default function MapSearch({
  id,
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
  icon,
  lightMode = false,
}: MapSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(
    Boolean(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [forceShowDropdown, setForceShowDropdown] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeRef = useRef<number>(0);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Add a failsafe timer to always reset loading state after a timeout
  const loadingFailsafeRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up all timers on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);
    };
  }, []);

  const {
    ready,
    suggestions: { status, data },
    setValue: setPlacesValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: 'initMap',
    requestOptions: {
      componentRestrictions: { country: 'pk' },
    },
    debounce: 300,
  });

  useEffect(() => {
    if (value) {
      setPlacesValue(value, false);
      setHasSelectedLocation(true);
    } else {
      setHasSelectedLocation(false);
    }
  }, [value, setPlacesValue]);

  // Enhanced loading state management
  useEffect(() => {
    // Always clear existing timers before setting new ones
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);

    // If we got any status, prepare to end the loading state
    if (status) {
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }

    // Failsafe: If loading hasn't been reset after 3 seconds, force it off
    if (isLoading) {
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
  }, [status, isLoading]);

  // Only show dropdown when explicitly needed
  useEffect(() => {
    const shouldShowDropdown =
      isFocused &&
      ready &&
      value.length > 0 && // Only when user has typed something
      (status === 'OK' || hasInteracted);

    setShowDropdown(shouldShowDropdown);
    setForceShowDropdown(shouldShowDropdown);

    // Hide dropdown when focus is lost
    if (!isFocused && !isSelectingItem) {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setShowDropdown(false);
        setForceShowDropdown(false);
      }, 200);
    }
  }, [isFocused, ready, status, value, hasInteracted, isSelectingItem]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setHasInteracted(true);
    onValueChange(newValue);
    setPlacesValue(newValue);

    // Reset loading failsafe timer
    if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);

    if (newValue.length > 0) {
      setIsLoading(true);
      setHighlightedIndex(-1);

      // Set a new failsafe timer
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } else {
      setHasSelectedLocation(false);
      onSelectPlace(null);
      setIsLoading(false);
      setShowDropdown(false);
      setForceShowDropdown(false);
    }
  }

  function handleClear() {
    setPlacesValue('', false);
    setHasSelectedLocation(false);
    onValueChange('');
    onSelectPlace(null);
    clearSuggestions();
    setIsLoading(false);
    setHighlightedIndex(-1);
    setShowDropdown(false);
    setForceShowDropdown(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  async function handleSelect(description: string) {
    try {
      setIsSelectingItem(true);
      setPlacesValue(description, false);
      onValueChange(description);
      clearSuggestions();
      setIsLoading(true);

      // Reset loading failsafe timer
      if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);

      // Set a new failsafe timer for geocoding operation
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // Longer timeout for geocoding

      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);

      setHasSelectedLocation(true);
      onSelectPlace({ lat, lng });

      if (inputRef.current) {
        if (id === 'from-location') {
          setTimeout(() => {
            const toField = document.getElementById(
              'to-location'
            ) as HTMLInputElement;
            if (toField) toField.focus();
          }, 10);
        } else {
          inputRef.current.blur();
          setShowDropdown(false);
          setForceShowDropdown(false);
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setHasSelectedLocation(false);
    } finally {
      // Ensure loading state is always turned off
      setIsLoading(false);

      // Clear any pending timers
      if (loadingFailsafeRef.current) {
        clearTimeout(loadingFailsafeRef.current);
      }

      setTimeout(() => {
        setIsSelectingItem(false);
        setShowDropdown(false);
        setForceShowDropdown(false);
      }, 300);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown && !forceShowDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (status === 'OK' && data.length > 0) {
          setHighlightedIndex((prev) =>
            prev < data.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (status === 'OK' && data.length > 0) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : data.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (
          status === 'OK' &&
          highlightedIndex >= 0 &&
          data[highlightedIndex]
        ) {
          handleSelect(data[highlightedIndex].description);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setForceShowDropdown(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  }

  // Enhanced click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        inputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        // Ensure we turn off all dropdown states
        setShowDropdown(false);
        setForceShowDropdown(false);
        setIsSelectingItem(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function handleFocus() {
    const focusTime = Date.now();
    focusTimeRef.current = focusTime;
    setIsFocused(true);

    // Only show dropdown if user has typed something
    if (value.length > 0) {
      setShowDropdown(true);
      setForceShowDropdown(true);
    }
  }

  function handleBlur() {
    if (!isSelectingItem) {
      setTimeout(() => {
        if (focusTimeRef.current <= Date.now() - 200) {
          setIsFocused(false);
        }
      }, 200);
    }
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'absolute left-4 top-3.5',
          lightMode ? 'text-[color:var(--color-accent)]' : 'text-emerald-500'
        )}
      >
        <i className={icon}></i>
      </div>

      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={!ready}
        className={cn(
          'w-full h-12 pl-12 pr-10 rounded-lg border',
          'transition-all duration-200 ease-in-out',
          'focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent focus:outline-none',
          isFocused
            ? 'border-[color:var(--color-accent)] bg-white shadow-md'
            : hasSelectedLocation
            ? lightMode
              ? 'border-gray-100 bg-white'
              : 'border-green-200 bg-white'
            : lightMode
            ? 'border-gray-100 bg-white'
            : 'border-gray-200 bg-gray-50'
        )}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown || forceShowDropdown}
        aria-autocomplete="list"
        aria-controls={`${id}-dropdown-list`}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${id}-item-${highlightedIndex}` : undefined
        }
      />

      {isLoading && value && (
        <div className="absolute right-10 top-3.5 text-gray-400">
          <i
            className="fas fa-circle-notch fa-spin text-sm"
            aria-hidden="true"
          ></i>
          <span className="sr-only">Loading</span>
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
          aria-label="Clear input"
        >
          <i className="fas fa-times text-sm" aria-hidden="true"></i>
        </button>
      )}

      {/* Non-floating dropdown - attached to the input */}
      {(showDropdown || forceShowDropdown) && value.length > 0 && (
        <div
          ref={dropdownRef}
          id={`${id}-dropdown-list`}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {!ready && (
            <div className="py-4 px-4 text-center text-gray-500">
              <div className="animate-pulse flex justify-center">
                <i
                  className="fas fa-circle-notch fa-spin mr-2"
                  aria-hidden="true"
                ></i>
                <span>Initializing...</span>
              </div>
            </div>
          )}

          {ready && isLoading && (
            <div className="py-4 px-4 text-center text-gray-500">
              <div className="animate-pulse flex justify-center">
                <i
                  className="fas fa-circle-notch fa-spin mr-2"
                  aria-hidden="true"
                ></i>
                <span>Searching...</span>
              </div>
            </div>
          )}

          {ready && !isLoading && status === 'ZERO_RESULTS' && (
            <div className="py-4 px-4 text-center text-gray-500">
              <i className="fas fa-search mr-2" aria-hidden="true"></i>
              <span>No results found</span>
            </div>
          )}

          {/* Removed the "Start typing" message as requested */}

          {status === 'REQUEST_DENIED' && (
            <div className="py-4 px-4 text-center text-red-500">
              <i
                className="fas fa-exclamation-triangle mr-2"
                aria-hidden="true"
              ></i>
              <span>API error: Request denied</span>
            </div>
          )}

          {ready &&
            !isLoading &&
            status === 'OK' &&
            data.map(
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
                    'cursor-pointer px-4 py-3 border-b border-gray-100 last:border-0',
                    highlightedIndex === index
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => handleSelect(description)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={highlightedIndex === index}
                >
                  <div className="font-medium text-gray-800">{main_text}</div>
                  <div className="text-xs text-gray-500">{secondary_text}</div>
                </div>
              )
            )}
        </div>
      )}
    </div>
  );
}
