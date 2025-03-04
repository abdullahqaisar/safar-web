export interface LocationSelectProps {
  pickup: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Station {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export interface MetroLine {
  id: string;
  name: string;
  color?: MetroLineColor;
  stations: Station[];
}

export interface RouteSegment {
  type: 'walk' | 'transit';
  line?: MetroLine; // optional since walking segments don't have a line
  stations: Station[];
  duration: number; // in seconds
  walkingTime?: number; // in seconds
  walkingDistance?: number; // in meters
}

export interface Route {
  segments: RouteSegment[];
  totalStops: number;
  totalDistance: number;
  totalDuration: number; // in seconds
}

export type MetroLineColor = 'red' | 'orange' | 'green' | 'blue';
