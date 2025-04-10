import { useState } from 'react';
import { useJourney } from './useJourney';

export function useJourneySearch(redirectPath: string) {
  const { fromLocation, toLocation, isFormValid } = useJourney();

  const [isNavigating, setIsNavigating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  const hasBothLocations = Boolean(fromLocation && toLocation);

  const buildUrlParams = (): string | null => {
    if (!fromLocation || !toLocation) return null;

    return `from=${fromLocation.latitude},${fromLocation.longitude}&to=${toLocation.latitude},${toLocation.longitude}`;
  };

  const submitSearch = async (event?: any) => {
    if (!fromLocation || !toLocation) {
      setFormError('Please select both origin and destination locations');
      return;
    }

    if (!isFormValid || isNavigating) return;

    try {
      setIsNavigating(true);
      setFormError(null);

      const params = buildUrlParams();
      if (!params) return;

      console.log(`Navigating to ${redirectPath}?${params}`);
    } finally {
      setIsNavigating(false)
    }
  };

  return {
    fromValue,
    toValue,
    setFromValue,
    setToValue,
    formError,
    setFormError,
    isNavigating,
    setIsNavigating,
    hasBothLocations,
    submitSearch,
    buildUrlParams,
  };
}