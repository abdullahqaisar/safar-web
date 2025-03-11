'use client';

import { MAPS_CONFIG } from '@lib/constants/maps';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useInputState } from '@/client/hooks/useInputState';
import { Coordinates } from '@/types/station';

interface MapSearchInputProps {
  onSelectPlace: (location: Coordinates | null) => void;
  placeholder: string;
  value?: string;
  onValueChange?: (value: string) => void;
  icon: string;
}

export default function MapSearchInput({
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
  icon,
}: MapSearchInputProps) {
  const { isFocused, inputProps } = useInputState();
  const [isSelecting, setIsSelecting] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSelect = useCallback(
    async (address: string) => {
      setIsSelecting(true);

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
          console.error('No results found for this address');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsSelecting(false);
      }
    },
    [setValue, clearSuggestions, onSelectPlace, onValueChange]
  );

  const handleClear = useCallback(() => {
    // First update UI state
    setValue('');
    clearSuggestions();

    // Then immediately notify parent - don't wait for debounce
    onSelectPlace(null);
    onValueChange?.('');
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

  return (
    <div className="relative">
      <i
        className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200
        ${isFocused ? 'text-green-900' : 'text-gray-400'}`}
      ></i>
      <input
        ref={inputRef}
        type="text"
        className={`w-full text-sm p-4 pl-12 pr-10 border bg-white rounded-lg transition-colors duration-200
          ${isFocused ? 'border-green-900' : 'border-gray-200'}
          ${!ready ? 'cursor-not-allowed bg-gray-50' : ''}
          focus:outline-none`}
        value={inputValue}
        onChange={handleInputChange}
        disabled={!ready}
        placeholder={!ready ? 'Loading...' : placeholder}
        {...inputProps}
      />
      {inputValue && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={handleClear}
          aria-label="Clear input"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
      {status === 'OK' && (
        <ul
          ref={dropdownRef}
          className="absolute z-[1000] w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-auto shadow-xl"
          style={{
            top: '100%',
            left: 0,
            right: 0,
          }}
        >
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex gap-2 items-center text-sm"
              onClick={() => handleSelect(description)}
            >
              <i className="fas fa-map-marker-alt text-green-700 text-sm"></i>
              <span className="line-clamp-2">{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
