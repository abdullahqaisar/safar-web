export const MAPS_CONFIG = {
  islamabadRawalpindiBounds: {
    south: 33.303484246772186,
    west: 72.73179891358622,
    north: 33.81673190394057,
    east: 73.43629721748141,
  },
  defaultCenter: {
    lat: 33.6844,
    lng: 73.0479, // Islamabad center
  },
  defaultZoom: 12,
  libraries: ['places'] as const,
} as const;

export const API_CONFIG = {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
};
