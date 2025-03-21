import { Coordinates } from '@/types/station';

export interface PopularLocation {
  id: number;
  name: string;
  type: string;
  coordinates: Coordinates;
}

/**
 * Returns a list of popular locations that could be used as destinations
 * In a real application, this would likely be fetched from an API
 */
export function getPopularLocations(): PopularLocation[] {
  // This is mock data - in a real app, this might come from an API
  // based on the user's location, popular transit hubs, etc.
  return [
    {
      id: 1,
      name: 'Central Park',
      type: 'Attraction',
      coordinates: { lat: 40.785091, lng: -73.968285 },
    },
    {
      id: 2,
      name: 'Business District',
      type: 'Business',
      coordinates: { lat: 40.712776, lng: -74.005974 },
    },
    {
      id: 3,
      name: 'University Campus',
      type: 'Education',
      coordinates: { lat: 40.729494, lng: -73.996599 },
    },
    {
      id: 4,
      name: 'Shopping Mall',
      type: 'Shopping',
      coordinates: { lat: 40.758896, lng: -73.98513 },
    },
  ];
}

/**
 * Gets a list of recently searched locations
 * Would typically be pulled from local storage or user account
 */
export function getRecentSearches(): PopularLocation[] {
  // In a real app, this would be fetched from localStorage or a user's account
  // For now, we'll return an empty array
  return [];
}
