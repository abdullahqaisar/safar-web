'use client';

import { useState, useEffect } from 'react';
import {
  findBestRoute,
  Route,
  findNearestStation,
} from '@/lib/route-finder/route-finder';
import { LocationSelectProps, Station } from '@/types/metro';
import { MAX_STATION_DISTANCE } from '@/constants/config';
import LocationSearch from './search/LocationSearch';
import { RouteResults } from './results/RouteResults';

export function JourneyPlanner() {
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fromLocationError, setFromLocationError] = useState<boolean>(false);
  const [toLocationError, setToLocationError] = useState<boolean>(false);

  // Clear error message when both stations are valid
  useEffect(() => {
    if (fromStation && toStation) {
      setErrorMessage('');
    }
  }, [fromStation, toStation]);

  const handleLocationSelect = (locations: LocationSelectProps) => {
    if (locations.pickup) {
      const nearest = findNearestStation(locations.pickup);
      setFromStation(nearest);
      setFromLocationError(!nearest);

      if (!nearest) {
        setErrorMessage(
          `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`
        );
      }
    }

    if (locations.destination) {
      const nearest = findNearestStation(locations.destination);
      setToStation(nearest);
      setToLocationError(!nearest);

      if (!nearest) {
        setErrorMessage(
          `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`
        );
      }
    }

    // Handle multiple errors
    if (locations.pickup && locations.destination) {
      const fromNearest = findNearestStation(locations.pickup);
      const toNearest = findNearestStation(locations.destination);

      if (!fromNearest && !toNearest) {
        setErrorMessage(
          `Both pickup and destination locations must be within ${MAX_STATION_DISTANCE}km of a metro station`
        );
      } else if (!fromNearest) {
        setErrorMessage(
          `No metro station found within ${MAX_STATION_DISTANCE}km of your pickup location`
        );
      } else if (!toNearest) {
        setErrorMessage(
          `No metro station found within ${MAX_STATION_DISTANCE}km of your destination location`
        );
      }
    }

    // Reset results when locations change
    setShowResults(false);
  };

  const handleFindRoute = () => {
    if (!fromStation || !toStation) {
      if (!fromStation && !toStation) {
        setErrorMessage('Please select both pickup and destination locations');
      } else if (!fromStation) {
        setErrorMessage('Please select a valid pickup location');
      } else {
        setErrorMessage('Please select a valid destination location');
      }
      setShowResults(false);
      return;
    }

    if (fromStation.id === toStation.id) {
      setErrorMessage('Start and destination stations are the same');
      setShowResults(false);
      return;
    }

    const bestRoute = findBestRoute(fromStation.id, toStation.id);
    if (bestRoute) {
      setRoute(bestRoute);
      setShowResults(true);
      setErrorMessage(''); // Clear error when route is found
    } else {
      setErrorMessage('No route found between these stations');
      setShowResults(false);
    }
  };

  // Determine if Find Route button should be disabled
  const findButtonDisabled =
    fromLocationError || toLocationError || !fromStation || !toStation;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-4xl font-semibold text-center text-green-700 mb-4">
        سفر
      </h1>
      <p className="text-xl text-center mb-6 text-gray-600">
        Find the best route in Islamabad&apos;s Confusing Metro System
      </p>

      <div className="mb-6">
        <LocationSearch onLocationSelect={handleLocationSelect} />
        {fromStation && (
          <div className="mt-2 text-sm text-gray-600">
            From station: {fromStation.name}
          </div>
        )}
        {toStation && (
          <div className="mt-2 text-sm text-gray-600">
            Destination station: {toStation.name}
          </div>
        )}
      </div>

      <button
        className={`w-full ${
          findButtonDisabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        } text-white p-3 rounded-md transition duration-200`}
        onClick={handleFindRoute}
        disabled={findButtonDisabled}
      >
        Find Route
      </button>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {showResults && route && <RouteResults route={route} />}
    </div>
  );
}
