import { MetroLine } from './metro';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Station {
  id: string;
  name: string;
  coordinates: Coordinates;
  lines?: string[];
}

export interface NearestStationResult {
  station: Station;
  distance: number;
  lines: MetroLine[];
  score?: number;
}

// New types for route finding
export interface Transfer {
  station: Station;
  toLine: MetroLine;
}

export interface RouteSegment {
  line: MetroLine;
  stations: Station[];
  transfers: Transfer[];
  distance: number;
}
