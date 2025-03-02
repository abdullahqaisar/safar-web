'use client';

import { useState } from 'react';
import { findBestRoute, Route, findNearestStation } from '@/lib/route-finder';
import { Station } from '@/lib/metro-data';
import GoogleMapsLocation from './GoogleMapsLocation';
import { LocationSelectProps } from '@/types/metro';
import { RouteResults } from './metro/RouteResults';

export function MetroRouter() {
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLocationSelect = (locations: LocationSelectProps) => {
    if (locations.pickup) {
      const nearest = findNearestStation(locations.pickup);
      setFromStation(nearest);
      setErrorMessage(
        nearest ? '' : 'No metro station found within 2km of pickup location'
      );
    }
    if (locations.destination) {
      const nearest = findNearestStation(locations.destination);
      setToStation(nearest);
      setErrorMessage(
        nearest
          ? ''
          : 'No metro station found within 2km of destination location'
      );
    }
  };

  const handleFindRoute = () => {
    setErrorMessage('');

    if (!fromStation || !toStation) {
      setErrorMessage('Please select both start and destination locations');
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
    } else {
      setErrorMessage('No route found between these stations');
      setShowResults(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-3xl font-bold text-center text-green-600 mb-8">
        Islamabad Metro Router
      </h1>

      <div className="mb-6">
        <GoogleMapsLocation onLocationSelect={handleLocationSelect} />
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
        className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition duration-200"
        onClick={handleFindRoute}
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
