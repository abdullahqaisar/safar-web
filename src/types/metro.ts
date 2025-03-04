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
  line?: MetroLine;
  stations: Station[];
  duration: number;
  walkingTime?: number;
  walkingDistance?: number;
}

export interface Route {
  segments: RouteSegment[];
  totalStops: number;
  totalDistance: number;
  totalDuration: number;
}

export type MetroLineColor = 'red' | 'orange' | 'green' | 'blue';
