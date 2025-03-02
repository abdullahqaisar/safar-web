export const MAPS_CONFIG = {
  islamabadRawalpindiBounds: {
    south: 33.363984,
    west: 73.021009,
    north: 33.7839,
    east: 73.187177,
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
