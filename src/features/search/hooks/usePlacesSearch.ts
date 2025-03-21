'use client';

import { useState, useEffect, useRef } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Coordinates } from '@/types/station';
import { storeUserSelectedLocation } from '../services/geocoding.service';

interface UsePlacesSearchProps {
  initialValue: string;
  onLocationSelect: (location: Coordinates | null) => void;
  onValueChange: (value: string) => void;
}

interface UsePlacesSearchReturn {
  value: string;
  isLoading: boolean;
  isReady: boolean;
  suggestions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  status: string;
  handleInputChange: (value: string) => void;
  handleClear: () => void;
  handleSelectPlace: (description: string) => Promise<void>;
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
    },
    debounce: 300,
  });

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
    onValueChange('');
    onLocationSelect(null);
    clearSuggestions();
    setIsLoading(false);
  };

  const setInputValue = (newValue: string) => {
    setValue(newValue);
    setPlacesValue(newValue, false);
  };

  const handleSelectPlace = async (description: string) => {
    try {
      setValue(description);
      setPlacesValue(description, false);
      onValueChange(description);
      clearSuggestions();
      setIsLoading(true);

      if (loadingFailsafeRef.current) clearTimeout(loadingFailsafeRef.current);
      loadingFailsafeRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);

      storeUserSelectedLocation(lat, lng, description);

      setHasSelectedLocation(true);
      onLocationSelect({ lat, lng });
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
    suggestions: data,
    status,
    handleInputChange,
    handleClear,
    handleSelectPlace,
    setInputValue,
    hasSelectedLocation,
  };
}
