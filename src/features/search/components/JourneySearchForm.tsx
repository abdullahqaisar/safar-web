'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchInput from './SearchInput';
import { Coordinates } from '@/types/station';
import { useJourney } from '@/features/journey/hooks/useJourney';
import LoadingSkeleton from './LoadingSkeleton';
import { LocateIcon, MapPin } from 'lucide-react';
import { useGoogleMapsScript } from '../hooks/useGoogleMapsScript';

interface JourneySearchFormProps {
  initialFromText?: string;
  initialToText?: string;
  onFromValueChange?: (value: string) => void;
  onToValueChange?: (value: string) => void;
  lightMode?: boolean;
  preload?: boolean;
}

const JourneySearchForm: React.FC<JourneySearchFormProps> = ({
  initialFromText = '',
  initialToText = '',
  onFromValueChange,
  onToValueChange,
  lightMode = false,
  preload = false,
}) => {
  const { setFromLocation, setToLocation } = useJourney();
  const [pickupValue, setPickupValue] = useState(initialFromText);
  const [destinationValue, setDestinationValue] = useState(initialToText);

  const searchParams = useSearchParams();
  const { isLoaded, isError, error } = useGoogleMapsScript({ lazy: !preload });

  useEffect(() => {
    if (isLoaded && searchParams) {
      const fromText = searchParams.get('fromText');
      const toText = searchParams.get('toText');

      if (fromText) {
        const decodedText = decodeURIComponent(fromText);
        setPickupValue(decodedText);
        if (onFromValueChange) onFromValueChange(decodedText);
      }
      if (toText) {
        const decodedText = decodeURIComponent(toText);
        setDestinationValue(decodedText);
        if (onToValueChange) onToValueChange(decodedText);
      }
    }
  }, [isLoaded, searchParams, onFromValueChange, onToValueChange]);

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

  return (
    <div
      className="w-full space-y-4 relative map-search-container"
      style={{ overflow: 'visible' }}
    >
      {isError && (
        <div className="p-2 mb-2 text-sm text-red-700 bg-red-100 rounded-md">
          {error ||
            "Couldn't load location search. Please try refreshing the page."}
        </div>
      )}

      {!isLoaded ? (
        <LoadingSkeleton lightMode={lightMode} />
      ) : (
        <>
          <div className="relative" style={{ overflow: 'visible' }}>
            <label
              htmlFor="from-location"
              className={`block mb-1 text-sm ${
                lightMode ? 'text-gray-600' : 'text-gray-200'
              } font-medium`}
            >
              From
            </label>
            <SearchInput
              id="from-location"
              onSelectPlace={handleFromLocationSelect}
              placeholder="Enter starting point"
              value={pickupValue}
              onValueChange={handleFromValueChange}
              icon={LocateIcon}
              lightMode={lightMode}
              aria-label="Origin location"
            />
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
            <SearchInput
              id="to-location"
              onSelectPlace={handleToLocationSelect}
              placeholder="Enter destination"
              value={destinationValue}
              onValueChange={handleToValueChange}
              icon={MapPin}
              lightMode={lightMode}
              aria-label="Destination location"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default JourneySearchForm;
