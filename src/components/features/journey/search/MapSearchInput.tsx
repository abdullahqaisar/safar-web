import { MAPS_CONFIG } from '@/constants/maps';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useEffect } from 'react';
import { useInputState } from '@/hooks/useInputState';

interface MapSearchInputProps {
  onSelectPlace: (location: google.maps.LatLngLiteral) => void;
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

  // Add effect to sync external value changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setValue(value, false);
    }
  }, [value, setValue, inputValue]);

  const handleSelect = async (address: string) => {
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
    }
  };

  return (
    <div className="relative">
      <i
        className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused ? 'text-green-500' : 'text-gray-400'}`}
      ></i>
      <input
        type="text"
        className={`w-full text-sm p-4 pl-12 border bg-white rounded-lg transition-colors duration-200
          ${isFocused ? 'border-green-500' : 'border-gray-200'}
          focus:outline-none`}
        value={inputValue}
        onChange={(e) => {
          setValue(e.target.value);
          onValueChange?.(e.target.value);
        }}
        disabled={!ready}
        placeholder={placeholder}
        {...inputProps}
      />
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
