import { MetroLine } from './metro';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Station {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export interface NearestStationResult {
  station: Station;
  distance: number;
  lines: MetroLine[];
}
