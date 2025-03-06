import { MetroLine } from './metro';
import { Station } from './station';

/**
 * Base interface for route segments
 */
export interface RouteSegment {
  type: 'walk' | 'transit';
  stations: Station[];
  duration: number;
}

/**
 * Transit segment representing travel on a metro line
 */
export interface TransitSegment extends RouteSegment {
  type: 'transit';
  line: MetroLine;
}

/**
 * Walking segment representing travel on foot
 */
export interface WalkSegment extends RouteSegment {
  type: 'walk';
  walkingTime: number;
  walkingDistance: number;
}

/**
 * Complete route composed of multiple segments
 */
export interface Route {
  segments: RouteSegment[];
  totalStops: number;
  totalDistance: number;
  totalDuration: number;
  transfers?: number;
}
