'use client';

import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import MapSearchInput from './MapSearchInput';
import LocationSearchSkeleton from './LocationSearchSkeleton';
import { Coordinates } from '@/types/station';

interface LocationSearchProps {
  onLocationSelect: (locations: {
    pickup: Coordinates | null;
    destination: Coordinates | null;
  }) => void;
}

export default function LocationSearch({
  onLocationSelect,
}: LocationSearchProps) {
  const [pickup, setPickup] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [pickupValue, setPickupValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  const handlePickupSelect = (location: Coordinates | null) => {
    setPickup(location);
    onLocationSelect({ pickup: location, destination });
  };

  const handleDestinationSelect = (location: Coordinates | null) => {
    setDestination(location);
    onLocationSelect({ pickup, destination: location });
  };

  if (!isLoaded) return <LocationSearchSkeleton />;

  return (
    <div className="w-full">
      <div className="space-y-4">
        <MapSearchInput
          onSelectPlace={handlePickupSelect}
          placeholder="From (e.g., Khanna Pul)"
          value={pickupValue}
          onValueChange={setPickupValue}
          icon="far fa-circle"
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
