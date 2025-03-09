import { MetroLine } from './metro';
import { Station } from './station';

/**
 * Base interface for route segments
 */
export interface RouteSegment {
  type: 'transit' | 'walk';
  stations: Station[];
  duration: number; // in seconds
}

/**
 * Transit segment representing travel on a metro line
 */
export interface TransitSegment extends RouteSegment {
  type: 'transit';
  line: Partial<Omit<MetroLine, 'station'>>;
  stopWaitTime?: number;
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
  id?: string;
  segments: RouteSegment[];
  totalStops: number;
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  transfers: number;
}
