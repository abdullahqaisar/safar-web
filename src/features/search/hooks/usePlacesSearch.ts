'use client';

import { useState, useEffect, useRef } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Coordinates } from '@/types/station';
import { storeUserSelectedLocation } from '../services/geocoding.service';
import { MAPS_CONFIG } from '@/lib/constants/maps';
import {
  searchStations,
  combineSearchResults,
  StationSearchResult,
} from '../utils/station-search';

interface UsePlacesSearchProps {
  initialValue: string;
  onLocationSelect: (location: Coordinates | null) => void;
  onValueChange: (value: string) => void;
}

// Define a Suggestion type for better type safety
export interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  isStation?: boolean;
  station?: StationSearchResult;
}

interface UsePlacesSearchReturn {
  value: string;
  isLoading: boolean;
  isReady: boolean;
  suggestions: Suggestion[];
  status: string;
  handleInputChange: (value: string) => void;
  handleClear: () => void;
  handleSelectPlace: (
    description: string,
    station?: StationSearchResult
  ) => Promise<void>;
  setInputValue: (value: string) => void;
  hasSelectedLocation: boolean;
}

export default function usePlacesSearch({
  initialValue,
  onLocationSelect,
  onValueChange,
}: UsePlacesSearchProps): UsePlacesSearchReturn {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(
    Boolean(initialValue)
  );
  const [stationResults, setStationResults] = useState<StationSearchResult[]>(
    []
  );
  const [combinedSuggestions, setCombinedSuggestions] = useState<Suggestion[]>(
    []
  );
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingFailsafeRef = useRef<NodeJS.Timeout | null>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue: setPlacesValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: 'initMap',
    requestOptions: {
      componentRestrictions: { country: 'pk' },
      locationRestriction: {
        south: MAPS_CONFIG.islamabadRawalpindiBounds.south,
        west: MAPS_CONFIG.islamabadRawalpindiBounds.west,
        north: MAPS_CONFIG.islamabadRawalpindiBounds.north,
        east: MAPS_CONFIG.islamabadRawalpindiBounds.east,
      },
    },
    debounce: 300,
  });

  // Update combined suggestions when either Google results or station results change
  useEffect(() => {
    setCombinedSuggestions(
      combineSearchResults(stationResults, data) as Suggestion[]
    );
  }, [data, stationResults]);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      setPlacesValue(initialValue, false);
      setHasSelectedLocation(true);
    }
  }, [initialValue, setPlacesValue]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);
    };
  }, []);

  useEffect(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);

    if (status) {
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }

    if (isLoading) {
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
  }, [status, isLoading]);

  const handleInputChange = (newValue: string) => {
    setValue(newValue);
    onValueChange(newValue);
    setPlacesValue(newValue);

    // Search for matching stations
    if (newValue.length >= 2) {
      const matchingStations = searchStations(newValue);
      setStationResults(matchingStations);
    } else {
      setStationResults([]);
    }

    if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);

    if (newValue.length > 0) {
      setIsLoading(true);
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } else {
      setHasSelectedLocation(false);
      onLocationSelect(null);
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setValue('');
    setPlacesValue('', false);
    setHasSelectedLocation(false);
    setStationResults([]);
    onValueChange('');
    onLocationSelect(null);
    clearSuggestions();
    setIsLoading(false);
  };

  const setInputValue = (newValue: string) => {
    setValue(newValue);
    setPlacesValue(newValue, false);
  };

  const handleSelectPlace = async (
    description: string,
    station?: StationSearchResult
  ) => {
    try {
      setValue(description);
      setPlacesValue(description, false);
      onValueChange(description);
      clearSuggestions();
      setIsLoading(true);
      setStationResults([]);

      if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      // If a station was directly selected, use its coordinates
      if (station) {
        const { lat, lng } = station.coordinates;
        storeUserSelectedLocation(lat, lng, description);
        setHasSelectedLocation(true);
        onLocationSelect({ lat, lng });
      } else {
        // Otherwise geocode the address using Google
        const results = await getGeocode({ address: description });
        const { lat, lng } = await getLatLng(results[0]);
        storeUserSelectedLocation(lat, lng, description);
        setHasSelectedLocation(true);
        onLocationSelect({ lat, lng });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setHasSelectedLocation(false);
    } finally {
      setIsLoading(false);
      if (loadingFailsafeRef.current) {
        clearTimeout(loadingFailsafeRef.current);
      }
    }
  };

  return {
    value,
    isLoading,
    isReady: ready,
    suggestions: combinedSuggestions,
    status,
    handleInputChange,
    handleClear,
    handleSelectPlace,
    setInputValue,
    hasSelectedLocation,
  };
}
