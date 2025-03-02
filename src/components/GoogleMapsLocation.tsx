import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import PlacesAutocomplete from './PlacesAutocomplete';

interface GoogleMapsLocationProps {
  onLocationSelect: (locations: {
    pickup: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
  }) => void;
}

export default function GoogleMapsLocation({
  onLocationSelect,
}: GoogleMapsLocationProps) {
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
      <div className="p-4 space-y-4">
        <PlacesAutocomplete
          onSelectPlace={handlePickupSelect}
          placeholder="Enter pickup location"
          value={pickupValue}
          onValueChange={setPickupValue}
        />
        <PlacesAutocomplete
          onSelectPlace={handleDestinationSelect}
          placeholder="Enter destination"
          value={destinationValue}
          onValueChange={setDestinationValue}
        />
      </div>
    </div>
  );
}
