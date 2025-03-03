'use client';

import { useState, useEffect } from 'react';
import { findNearestStation } from '@/lib/route-finder/route-finder';
import { LocationSelectProps, Station } from '@/types/metro';
import { MAX_STATION_DISTANCE } from '@/constants/config';
import { Alert } from '../../../ui/Alert';
import { SearchButton } from '../../../ui/SearchButton';
import LocationSearch from './LocationSearch';

interface SearchFormProps {
  onSearch: (from: Station, to: Station) => void;
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
  const [fromLocationError, setFromLocationError] = useState<boolean>(false);
  const [toLocationError, setToLocationError] = useState<boolean>(false);

  useEffect(() => {
    if (fromStation && toStation && fromStation.id === toStation.id) {
      onError('Start and destination stations are the same');
    }
  }, [fromStation, toStation, onError]);

  const handleLocationSelect = (locations: LocationSelectProps) => {
    if (locations.pickup) {
      const nearest = findNearestStation(locations.pickup);
      setFromStation(nearest);
      setFromLocationError(!nearest);

      if (!nearest) {
        onError(
          `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`
        );
      }
    }

    if (locations.destination) {
      const nearest = findNearestStation(locations.destination);
      setToStation(nearest);
      setToLocationError(!nearest);

      if (!nearest) {
        onError(
          `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`
        );
      }
    }

    if (locations.pickup && locations.destination) {
      const fromNearest = findNearestStation(locations.pickup);
      const toNearest = findNearestStation(locations.destination);

      if (!fromNearest && !toNearest) {
        onError(
          `Both pickup and destination locations must be within ${MAX_STATION_DISTANCE}km of a metro station`
        );
      }
    }
  };

  const handleFindRoute = () => {
    if (!fromStation || !toStation) {
      onError(
        !fromStation && !toStation
          ? 'Please select both pickup and destination locations'
          : !fromStation
          ? 'Please select a valid pickup location'
          : 'Please select a valid destination location'
      );
      return;
    }

    onSearch(fromStation, toStation);
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
