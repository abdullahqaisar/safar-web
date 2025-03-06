'use client';

import { MAPS_CONFIG } from '@/constants/maps';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useEffect, useState } from 'react';
import { useInputState } from '@/hooks/useInputState';

interface MapSearchInputProps {
  onSelectPlace: (location: google.maps.LatLngLiteral | null) => void;
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
    defaultValue: value,
    debounce: 300,
  });

  // Add effect to sync external value changes, but only when not in selection process
  useEffect(() => {
    if (!isSelecting && value !== undefined && value !== inputValue) {
      setValue(value, false);
    }
  }, [value, setValue, inputValue, isSelecting]);

  const handleSelect = async (address: string) => {
    setIsSelecting(true);

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
        onSelectPlace({ lat: location.lat(), lng: location.lng() });
        onValueChange?.(address);
      }
    } catch (error) {
      console.error('Error: ', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleClear = () => {
    setIsSelecting(true);
    setValue('');
    clearSuggestions();
    onSelectPlace(null);
    onValueChange?.('');
    setIsSelecting(false);
  };

  return (
    <div className="relative">
      <i
        className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200
      ${isFocused ? 'text-green-900' : 'text-gray-400'}`}
      ></i>
      <input
        type="text"
        className={`w-full text-sm p-4 pl-12 pr-10 border bg-white rounded-lg transition-colors duration-200
      ${isFocused ? 'border-green-900' : 'border-gray-200'}
      ${!ready ? 'cursor-not-allowed bg-gray-50' : ''}
      focus:outline-none`}
        value={inputValue}
        onChange={(e) => {
          setValue(e.target.value);
          if (!isSelecting) {
            onValueChange?.(e.target.value);
          }
        }}
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
