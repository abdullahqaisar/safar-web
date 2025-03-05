import { MetroLine } from './metro';
import { Station } from './station';

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
