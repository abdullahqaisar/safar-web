'use client';

import { useEffect, useRef, useState } from 'react';
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
}

export default function MapSearch({
  id,
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
  icon,
}: MapSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOptionClicked, setIsOptionClicked] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);

  const isUserTypingRef = useRef(false);
  const internalValueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

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
    internalValueRef.current = value;
    if (value) {
      setPlacesValue(value, false);
    }
  }, []);

  useEffect(() => {
    if (!isUserTypingRef.current && value !== internalValueRef.current) {
      internalValueRef.current = value;
      setPlacesValue(value, false);
      setHasSelectedLocation(Boolean(value));
    }
  }, [value, setPlacesValue]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;

    isUserTypingRef.current = true;

    internalValueRef.current = newValue;
    onValueChange(newValue);
    setPlacesValue(newValue);

    if (newValue === '') {
      setHasSelectedLocation(false);
      onSelectPlace(null);
    } else {
      setIsOptionClicked(false);
    }

    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  }

  function handleClear() {
    internalValueRef.current = '';
    setPlacesValue('', false);
    setHasSelectedLocation(false);
    setIsOptionClicked(false);

    onValueChange('');
    onSelectPlace(null);
    clearSuggestions();

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  async function handleSelect(description: string) {
    internalValueRef.current = description;
    setPlacesValue(description, false);
    setIsOptionClicked(true);

    onValueChange(description);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);

      setHasSelectedLocation(true);
      onSelectPlace({ lat, lng });

      if (inputRef.current) {
        inputRef.current.blur();
        setTimeout(() => {
          if (
            id === 'from-location' &&
            document.getElementById('to-location')
          ) {
            document.getElementById('to-location')?.focus();
          }
        }, 10);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setHasSelectedLocation(false);
    }
  }

  const suggestionItems = data.map((suggestion) => {
    const {
      place_id,
      structured_formatting: { main_text, secondary_text },
    } = suggestion;

    return (
      <li
        key={place_id}
        className="cursor-pointer px-4 py-2 hover:bg-gray-100 transition-colors"
        onClick={() => {
          handleSelect(suggestion.description);
        }}
      >
        <div className="font-medium text-gray-800">{main_text}</div>
        <div className="text-xs text-gray-500">{secondary_text}</div>
      </li>
    );
  });

  return (
    <div className="relative w-full">
      <div className="absolute left-4 top-3.5 text-emerald-500">
        <i className={icon}></i>
      </div>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        disabled={!ready}
        className={cn(
          'w-full h-12 pl-12 pr-10 rounded-lg border',
          'transition-all duration-200 ease-in-out',
          'focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none',
          isFocused
            ? 'border-emerald-500 bg-white shadow-md'
            : hasSelectedLocation
            ? 'border-green-200 bg-white'
            : 'border-gray-200 bg-gray-50'
        )}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsFocused(false);
          }, 150);
        }}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
          aria-label="Clear input"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      )}

      {status === 'OK' && isFocused && !isOptionClicked && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestionItems}
        </ul>
      )}
    </div>
  );
}
