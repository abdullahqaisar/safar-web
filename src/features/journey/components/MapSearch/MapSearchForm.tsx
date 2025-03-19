'use client';

import React from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MapSearch from './MapSearch';
import { Coordinates } from '@/types/station';
import { useJourney } from '@/features/journey/hooks/useJourney';
import LoadingSkeleton from './LoadingSkeleton';

interface MapSearchFormProps {
  initialFromText?: string;
  initialToText?: string;
  onFromValueChange?: (value: string) => void;
  onToValueChange?: (value: string) => void;
  lightMode?: boolean;
}

const MapSearchForm: React.FC<MapSearchFormProps> = ({
  initialFromText = '',
  initialToText = '',
  onFromValueChange,
  onToValueChange,
  lightMode = false,
}) => {
  const { setFromLocation, setToLocation } = useJourney();
  const [pickupValue, setPickupValue] = useState(initialFromText);
  const [destinationValue, setDestinationValue] = useState(initialToText);

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

  const handleFromValueChange = (value: string) => {
    setPickupValue(value);
    if (onFromValueChange) onFromValueChange(value);
  };

  const handleToValueChange = (value: string) => {
    setDestinationValue(value);
    if (onToValueChange) onToValueChange(value);
  };

  if (!isLoaded) return <LoadingSkeleton />;

  return (
    <div className="w-full space-y-4 relative" style={{ overflow: 'visible' }}>
      <div className="relative" style={{ overflow: 'visible' }}>
        <label
          htmlFor="from-location"
          className={`block mb-1 text-sm ${
            lightMode ? 'text-gray-600' : 'text-gray-200'
          } font-medium`}
        >
          From
        </label>
        <MapSearch
          id="from-location"
          onSelectPlace={handleFromLocationSelect}
          placeholder="From (e.g., Khanna Pul)"
          value={pickupValue}
          onValueChange={handleFromValueChange}
          icon="far fa-circle"
          lightMode={lightMode}
        />
      </div>

      <div className="relative">
        <div className="absolute left-4 h-full flex items-center justify-center z-10">
          <div
            className={`h-full border-l border-dashed ${
              lightMode ? 'border-gray-300' : 'border-gray-600'
            } ml-[1px]`}
          ></div>
        </div>
      </div>

      <div className="relative" style={{ overflow: 'visible' }}>
        <label
          htmlFor="to-location"
          className={`block mb-1 text-sm ${
            lightMode ? 'text-gray-600' : 'text-gray-200'
          } font-medium`}
        >
          To
        </label>
        <MapSearch
          id="to-location"
          onSelectPlace={handleToLocationSelect}
          placeholder="To (e.g., Air University)"
          value={destinationValue}
          onValueChange={handleToValueChange}
          icon="fas fa-map-marker-alt"
          lightMode={lightMode}
        />
      </div>
    </div>
  );
};

export default MapSearchForm;
