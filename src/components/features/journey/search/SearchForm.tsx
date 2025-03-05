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

  useEffect(() => {
    if (fromStation && toStation && fromStation.id === toStation.id) {
      onError('Start and destination stations are the same');
    }
  }, [fromStation, toStation, onError]);

  const handleLocationSelect = async (locations: LocationSelectProps) => {
    if (locations.pickup) {
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

    if (locations.destination) {
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

    if (locations.pickup && locations.destination) {
      const fromNearest = await getNearestStation(locations.pickup);
      const toNearest = await getNearestStation(locations.destination);

      if (!fromNearest && !toNearest) {
        onError(
          `Both pickup and destination locations must be within ${MAX_STATION_DISTANCE}km of a metro station`
        );
      }
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

  return (
    <div className="p-6 bg-white rounded-t-xl mb-6">
      <LocationSearch onLocationSelect={handleLocationSelect} />
      {errorMessage && <Alert message={errorMessage} />}
      <SearchButton onClick={handleFindRoute} disabled={isSearchDisabled} />
    </div>
  );
}
