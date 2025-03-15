'use client';

import { useLoadScript } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MapSearch from './MapSearch';
import LoadingSkeleton from './LoadingSkeleton';
import { useJourney } from '@/features/journey/context/JourneyContext';
import { Coordinates } from '@/types/station';

export default function LocationSearchInput() {
  const { setFromLocation, setToLocation } = useJourney();
  const [pickupValue, setPickupValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');

  const searchParams = useSearchParams();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  useEffect(() => {
    if (isLoaded && searchParams) {
      const fromText = searchParams.get('fromText');
      const toText = searchParams.get('toText');

      if (fromText) setPickupValue(decodeURIComponent(fromText));
      if (toText) setDestinationValue(decodeURIComponent(toText));
    }
  }, [isLoaded, searchParams]);

  function handleFromLocationSelect(location: Coordinates | null) {
    setFromLocation(location);
  }

  function handleToLocationSelect(location: Coordinates | null) {
    setToLocation(location);
  }

  if (!isLoaded) return <LoadingSkeleton />;

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <MapSearch
          id="from-location"
          onSelectPlace={handleFromLocationSelect}
          placeholder="From (e.g., Khanna Pul)"
          value={pickupValue}
          onValueChange={setPickupValue}
          icon="far fa-circle"
        />
      </div>

      <div className="relative">
        <div className="absolute left-4 h-full flex items-center justify-center z-10">
          <div className="h-full border-l border-dashed border-gray-300 ml-[1px]"></div>
        </div>
      </div>

      <div className="relative">
        <MapSearch
          id="to-location"
          onSelectPlace={handleToLocationSelect}
          placeholder="To (e.g., Air University)"
          value={destinationValue}
          onValueChange={setDestinationValue}
          icon="fas fa-map-marker-alt"
        />
      </div>
    </div>
  );
}
