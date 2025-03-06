'use client';

import { useState, useEffect } from 'react';
import { MAX_STATION_DISTANCE } from '@/constants/config';
import { Alert } from '../../../ui/Alert';
import { SearchButton } from '../../../ui/SearchButton';
import LocationSearch from './LocationSearch';
import { Station } from '@/types/station';
import { getNearestStation } from '@/lib/services/station.service';

interface LocationSelectProps {
  pickup: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
}
interface SearchFormProps {
  onSearch: (
    from: Station,
    to: Station,
    fromLocation: google.maps.LatLngLiteral,
    toLocation: google.maps.LatLngLiteral
  ) => void;
  onError: (message: string) => void;
  errorMessage: string;
}

export function SearchForm({
  onSearch,
  onError,
  errorMessage,
}: SearchFormProps) {
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [fromLocation, setFromLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [toLocation, setToLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [fromLocationError, setFromLocationError] = useState<boolean>(false);
  const [toLocationError, setToLocationError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (fromStation && toStation && fromStation.id === toStation.id) {
      onError('Start and destination stations are the same');
    }
  }, [fromStation, toStation, onError]);

  const handleLocationSelect = async (locations: LocationSelectProps) => {
    const shouldShowLoading =
      (locations.pickup !== undefined &&
        locations.pickup !== null &&
        toLocation !== null) ||
      (locations.destination !== undefined &&
        locations.destination !== null &&
        fromLocation !== null);

    if (shouldShowLoading) {
      setIsLoading(true);
    }

    try {
      // Reset errors when locations change
      if (locations.pickup !== undefined) {
        if (locations.pickup === null) {
          // Handle clearing of pickup location
          setFromLocation(null);
          setFromStation(null);
          setFromLocationError(false);
        } else {
          // Handle setting new pickup location
          setFromLocation(locations.pickup);
          const nearest = await getNearestStation(locations.pickup);
          setFromStation(nearest);
          setFromLocationError(!nearest);

          if (!nearest) {
            onError(
              `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`
            );
          }
        }
      }

      if (locations.destination !== undefined) {
        if (locations.destination === null) {
          // Handle clearing of destination location
          setToLocation(null);
          setToStation(null);
          setToLocationError(false);
        } else {
          // Handle setting new destination location
          setToLocation(locations.destination);
          const nearest = await getNearestStation(locations.destination);
          setToStation(nearest);
          setToLocationError(!nearest);

          if (!nearest) {
            onError(
              `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`
            );
          }
        }
      }

      if (locations.pickup && locations.destination) {
        const fromNearest = await getNearestStation(locations.pickup);
        const toNearest = await getNearestStation(locations.destination);

        if (!fromNearest && !toNearest) {
          onError(
            `Both pickup and destination locations must be within ${MAX_STATION_DISTANCE}km of a metro station`
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindRoute = () => {
    if (!fromStation || !toStation || !fromLocation || !toLocation) {
      onError('Please select both pickup and destination locations');
      return;
    }

    onSearch(fromStation, toStation, fromLocation, toLocation);
  };

  const isSearchDisabled =
    fromLocationError ||
    toLocationError ||
    !fromStation ||
    !toStation ||
    (fromStation && toStation && fromStation.id === toStation.id);

  const hasBothLocations = fromLocation !== null && toLocation !== null;

  return (
    <div className="py-8 px-4 sm:py-14 sm:px-24 bg-[#0d442b] rounded-xl mb-6">
      <LocationSearch onLocationSelect={handleLocationSelect} />
      {errorMessage && <Alert message={errorMessage} />}
      <SearchButton
        onClick={handleFindRoute}
        disabled={isSearchDisabled}
        isLoading={isLoading && hasBothLocations}
        missingLocations={!fromLocation || !toLocation}
      />
    </div>
  );
}
