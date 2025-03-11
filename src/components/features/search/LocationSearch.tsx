'use client';

import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import MapSearchInput from './MapSearchInput';
import LocationSearchSkeleton from './LocationSearchSkeleton';
import { useJourney } from '@/client/context/JourneyContext';

export default function LocationSearch() {
  const { setFromLocation, setToLocation } = useJourney();
  const [pickupValue, setPickupValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  if (!isLoaded) return <LocationSearchSkeleton />;

  return (
    <div className="w-full">
      <div className="space-y-4">
        <MapSearchInput
          onSelectPlace={setFromLocation}
          placeholder="From (e.g., Khanna Pul)"
          value={pickupValue}
          onValueChange={setPickupValue}
          icon="far fa-circle"
        />

        <MapSearchInput
          onSelectPlace={setToLocation}
          placeholder="To (e.g., Air University)"
          value={destinationValue}
          onValueChange={setDestinationValue}
          icon="fas fa-map-marker-alt"
        />
      </div>
    </div>
  );
}
