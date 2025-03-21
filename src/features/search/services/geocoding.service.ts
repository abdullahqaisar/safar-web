/**
 * Converts coordinates to place names using Google's Geocoding API
 */

// Simple in-memory cache to reduce API calls
const geocodeCache: Record<string, string> = {};

// Store user-selected location names to maintain precision
const userSelectionCache: Record<string, string> = {};

// Function to check if Google Maps API is available
export function isGoogleMapsApiLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof google !== 'undefined' && !!google.maps;
}

/**
 * Wait for Google Maps API to be available
 * @param maxWaitTime - Maximum time to wait in ms
 * @param checkInterval - Interval between checks in ms
 */
export function waitForGoogleMapsApi(
  maxWaitTime = 10000,
  checkInterval = 200
): Promise<boolean> {
  return new Promise((resolve) => {
    // If already loaded, resolve immediately
    if (isGoogleMapsApiLoaded()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkTimer = setInterval(() => {
      if (isGoogleMapsApiLoaded()) {
        clearInterval(checkTimer);
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= maxWaitTime) {
        clearInterval(checkTimer);
        resolve(false);
      }
    }, checkInterval);
  });
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  retryCount = 3,
  retryDelay = 1000
): Promise<string> {
  try {
    // Try to wait for Google Maps to load if not already loaded
    if (!isGoogleMapsApiLoaded()) {
      const loaded = await waitForGoogleMapsApi();
      if (!loaded) {
        console.warn('Google Maps API failed to load within timeout period');
        return 'Selected location';
      }
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise<string>((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results[0].formatted_address);
        } else if (retryCount > 0 && status === 'OVER_QUERY_LIMIT') {
          // Retry with backoff if we hit query limits
          setTimeout(() => {
            reverseGeocode(lat, lng, retryCount - 1, retryDelay * 1.5)
              .then(resolve)
              .catch(() => resolve('Selected location'));
          }, retryDelay);
        } else {
          console.warn(`Geocoding failed with status: ${status}`);
          resolve('Selected location'); // Fallback
        }
      });
    });
  } catch (error) {
    console.error('Error in reverse geocoding:', error);

    // Retry logic
    if (retryCount > 0) {
      return new Promise((resolve) => {
        setTimeout(() => {
          reverseGeocode(lat, lng, retryCount - 1, retryDelay * 1.5)
            .then(resolve)
            .catch(() => resolve('Selected location'));
        }, retryDelay);
      });
    }

    return 'Selected location'; // Final fallback
  }
}

/**
 * Stores a user-selected location name for specific coordinates
 * This ensures we maintain the exact text the user selected
 */
export function storeUserSelectedLocation(
  lat: number,
  lng: number,
  placeName: string
): void {
  if (!lat || !lng || !placeName) return;

  const cacheKey = `${lat.toFixed(7)},${lng.toFixed(7)}`;
  userSelectionCache[cacheKey] = placeName;
}

/**
 * Get location name with preference for user-selected name
 * Falls back to reverse geocoding if no user selection exists
 */
export async function getCachedLocationName(
  lat: number,
  lng: number,
  preferUserSelection = true
): Promise<string> {
  if (!lat || !lng) {
    return 'Selected location';
  }

  const cacheKey = `${lat.toFixed(7)},${lng.toFixed(7)}`;

  // First try to return user-selected text when preferred
  if (preferUserSelection && userSelectionCache[cacheKey]) {
    return userSelectionCache[cacheKey];
  }

  // Then try geocode cache for API-returned names
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  // Finally, fetch from geocoding API
  try {
    const placeName = await reverseGeocode(lat, lng);
    geocodeCache[cacheKey] = placeName;
    return placeName;
  } catch (error) {
    console.error('Failed to get location name:', error);
    return 'Selected location';
  }
}

/**
 * Clear cached location data
 */
export function clearLocationCache(): void {
  Object.keys(geocodeCache).forEach((key) => delete geocodeCache[key]);
  Object.keys(userSelectionCache).forEach(
    (key) => delete userSelectionCache[key]
  );
}
