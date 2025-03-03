import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import MapSearchInput from './MapSearchInput';

interface LocationSearchProps {
  onLocationSelect: (locations: {
    pickup: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
  }) => void;
}

export default function LocationSearch({
  onLocationSelect,
}: LocationSearchProps) {
  const [pickup, setPickup] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [pickupValue, setPickupValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  const handlePickupSelect = (location: google.maps.LatLngLiteral) => {
    setPickup(location);
    onLocationSelect({ pickup: location, destination });
  };

  const handleDestinationSelect = (location: google.maps.LatLngLiteral) => {
    setDestination(location);
    onLocationSelect({ pickup, destination: location });
  };

  const handleExchange = () => {
    if (pickupValue && destinationValue && pickup && destination) {
      // Create temporary variables to hold current values
      const tempPickup = pickup;
      const tempPickupValue = pickupValue;

      // Update pickup with destination values
      setPickup(destination);
      setPickupValue(destinationValue);

      // Update destination with pickup values
      setDestination(tempPickup);
      setDestinationValue(tempPickupValue);

      // Notify parent with swapped locations
      onLocationSelect({
        pickup: destination,
        destination: tempPickup,
      });

      // Force refresh the input components
      const pickupInput = document.querySelector(
        'input[placeholder*="From"]'
      ) as HTMLInputElement;
      const destInput = document.querySelector(
        'input[placeholder*="To"]'
      ) as HTMLInputElement;
      if (pickupInput && destInput) {
        pickupInput.value = destinationValue;
        destInput.value = tempPickupValue;
      }
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="w-full">
      <div className="space-y-4">
        <MapSearchInput
          onSelectPlace={handlePickupSelect}
          placeholder="From (e.g., Khanna Pul)"
          value={pickupValue}
          onValueChange={setPickupValue}
          icon="fas fa-circle"
        />

        <div className="relative">
          <button
            onClick={handleExchange}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#0da84e] transition-colors z-10"
            disabled={!pickupValue || !destinationValue}
          >
            <i className="fas fa-exchange-alt"></i>
          </button>
        </div>

        <MapSearchInput
          onSelectPlace={handleDestinationSelect}
          placeholder="To (e.g., Air University)"
          value={destinationValue}
          onValueChange={setDestinationValue}
          icon="fas fa-map-marker-alt"
        />
      </div>
    </div>
  );
}
