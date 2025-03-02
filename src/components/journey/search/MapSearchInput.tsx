import { MAPS_CONFIG } from '@/constants/maps';
import usePlacesAutocomplete from 'use-places-autocomplete';

interface PlacesAutocompleteProps {
  onSelectPlace: (location: google.maps.LatLngLiteral) => void;
  placeholder: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export default function MapSearchInput({
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
}: PlacesAutocompleteProps) {
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
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded"
        value={inputValue}
        onChange={(e) => {
          setValue(e.target.value);
          onValueChange?.(e.target.value);
        }}
        disabled={!ready}
        placeholder={placeholder}
      />
      {status === 'OK' && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-2 cursor-pointer hover:bg-gray-100"
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
