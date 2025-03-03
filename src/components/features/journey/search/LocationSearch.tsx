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
