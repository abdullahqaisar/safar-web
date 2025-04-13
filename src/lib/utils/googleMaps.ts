import { Libraries } from '@react-google-maps/api';

export const googleMapsLibraries: Libraries = ['places'];

export const googleMapsApiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const defaultMapOptions = {
  componentRestrictions: { country: 'pk' },
};

if (!googleMapsApiKey) {
  console.warn(
    'Google Maps API key is missing. Map functionality will not work properly.'
  );
}
