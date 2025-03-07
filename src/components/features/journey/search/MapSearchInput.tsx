'use client';

import { MAPS_CONFIG } from '@/lib/constants/maps';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useEffect, useState, useCallback } from 'react';
import { useInputState } from '@/hooks/useInputState';
import { Coordinates } from '@/types/station';
import { transitions } from '@/lib/constants/theme';

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
        className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 ${
          transitions.DEFAULT
        }
        ${isFocused ? 'text-primary-900' : 'text-gray-400'}`}
      ></i>
      <input
        type="text"
        className={`w-full text-sm p-4 pl-12 pr-10 border bg-white rounded-lg shadow-sm ${
          transitions.DEFAULT
        }
          ${
            isFocused
              ? 'border-primary-600 shadow-input-focus'
              : 'border-gray-200'
          }
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
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-auto shadow-lg">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
