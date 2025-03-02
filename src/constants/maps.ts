export const MAPS_CONFIG = {
  islamabadRawalpindiBounds: new google.maps.LatLngBounds(
    new google.maps.LatLng(33.363984, 73.021009),
    new google.maps.LatLng(33.7839, 73.187177)
  ),
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
