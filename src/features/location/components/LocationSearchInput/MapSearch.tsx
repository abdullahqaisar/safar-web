'use client';

import { MAPS_CONFIG } from '@lib/constants/maps';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useInputState } from '@/hooks/useInputState';
import { Coordinates } from '@/types/station';
import { motion, AnimatePresence } from 'framer-motion';

interface MapSearchProps {
  onSelectPlace: (location: Coordinates | null) => void;
  placeholder: string;
  value?: string;
  onValueChange?: (value: string) => void;
  icon: string;
  id?: string;
}

export default function MapSearch({
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
  icon,
  id,
}: MapSearchProps) {
  const { isFocused, inputProps } = useInputState();
  const [isSelecting, setIsSelecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMicroLoading, setIsMicroLoading] = useState(false);

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'PK' },
      bounds: MAPS_CONFIG.islamabadRawalpindiBounds,
    },
    defaultValue: value || '',
    debounce: 300,
  });

  // Sync external value changes only when not selecting
  useEffect(() => {
    if (!isSelecting && value !== undefined && value !== inputValue) {
      setValue(value, false);
    }
  }, [value, setValue, inputValue, isSelecting]);

  // Status message handler
  useEffect(() => {
    if (status === 'ZERO_RESULTS') {
      setStatusMessage('No locations found. Try different search terms.');
    } else if (status === 'OVER_QUERY_LIMIT') {
      setStatusMessage('Too many requests. Please try again later.');
    } else if (status === 'REQUEST_DENIED') {
      setStatusMessage('Location search is currently unavailable.');
    } else if (status === 'INVALID_REQUEST') {
      setStatusMessage('Please enter a search term.');
    } else {
      setStatusMessage('');
    }
  }, [status]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        inputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        clearSuggestions();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dropdownRef.current || status !== 'OK') return;

      const items = Array.from(dropdownRef.current.querySelectorAll('li'));
      const activeElement = document.activeElement;
      const activeIndex = items.findIndex((item) => item === activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (activeIndex < items.length - 1) {
            (items[activeIndex + 1] as HTMLElement).focus();
          } else {
            (items[0] as HTMLElement).focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (activeIndex > 0) {
            (items[activeIndex - 1] as HTMLElement).focus();
          } else {
            (items[items.length - 1] as HTMLElement).focus();
          }
          break;
        case 'Escape':
          e.preventDefault();
          clearSuggestions();
          inputRef.current?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [status, clearSuggestions]);

  const handleSelect = useCallback(
    async (address: string) => {
      setIsSelecting(true);
      setIsMicroLoading(true);

      // First update the visual input value immediately
      setValue(address, false);
      clearSuggestions();

      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({
          address,
          bounds: MAPS_CONFIG.islamabadRawalpindiBounds,
          region: 'PK',
        });

        if (result.results[0]) {
          const location = result.results[0].geometry.location;
          const coordinates = { lat: location.lat(), lng: location.lng() };

          // Update parent values synchronously
          onValueChange?.(address);
          onSelectPlace(coordinates);
        } else {
          setStatusMessage(
            'No exact location found. Please try another search.'
          );
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setStatusMessage('Could not find this location. Please try again.');
      } finally {
        setIsSelecting(false);
        // Short delay to show loading state
        setTimeout(() => setIsMicroLoading(false), 300);
      }
    },
    [setValue, clearSuggestions, onSelectPlace, onValueChange]
  );

  const handleClear = useCallback(() => {
    // First update UI state
    setValue('');
    clearSuggestions();
    setStatusMessage('');

    // Then immediately notify parent - don't wait for debounce
    onSelectPlace(null);
    onValueChange?.('');

    // Focus on input after clearing
    inputRef.current?.focus();
  }, [setValue, clearSuggestions, onSelectPlace, onValueChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onValueChange?.(newValue);

      // If input is cleared, immediately reset location
      if (newValue === '') {
        onSelectPlace(null);
      }
    },
    [setValue, onSelectPlace, onValueChange]
  );

  const inputId =
    id || `location-search-${placeholder.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative">
      <div className="relative">
        <motion.i
          initial={{ opacity: 0.6 }}
          animate={{
            opacity: 1,
            color: isFocused ? '#166534' : '#9ca3af',
          }}
          className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300`}
        ></motion.i>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          className={`w-full text-sm p-4 pl-12 pr-10 border bg-white rounded-lg shadow-sm
            ${
              isFocused
                ? 'border-green-700 shadow-sm shadow-green-100'
                : 'border-gray-200'
            }
            ${!ready ? 'cursor-not-allowed bg-gray-50' : ''}
            ${isMicroLoading ? 'bg-green-50/50' : ''}
            focus:outline-none transition-all duration-300`}
          value={inputValue}
          onChange={handleInputChange}
          disabled={!ready}
          placeholder={!ready ? 'Loading...' : placeholder}
          aria-label={placeholder}
          {...inputProps}
        />
        <AnimatePresence>
          {inputValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
              onClick={handleClear}
              aria-label="Clear input"
            >
              <i className="fas fa-times"></i>
            </motion.button>
          )}
        </AnimatePresence>

        {isMicroLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-12 top-1/2 -translate-y-1/2"
          >
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {status === 'OK' && (
          <motion.ul
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[9999] w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-auto shadow-xl"
            style={{
              top: '100%',
              left: 0,
              right: 0,
              position: 'absolute',
            }}
            role="listbox"
          >
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                className="p-3 hover:bg-green-50 focus:bg-green-100 cursor-pointer border-b border-gray-100 last:border-b-0 flex gap-2 items-center text-sm outline-none transition-colors duration-150"
                onClick={() => handleSelect(description)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSelect(description)
                }
                tabIndex={0}
                role="option"
              >
                <i className="fas fa-map-marker-alt text-green-700 text-sm"></i>
                <span className="line-clamp-2">{description}</span>
              </li>
            ))}
          </motion.ul>
        )}

        {statusMessage && !isMicroLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-sm text-amber-600 pl-4"
          >
            <i className="fas fa-info-circle mr-1"></i> {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
