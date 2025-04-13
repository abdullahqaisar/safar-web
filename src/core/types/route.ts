import { Coordinates } from './graph';

export interface RouteStation {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export interface TransitLine {
  id: string;
  name: string;
  color?: string;
  ticketCost?: number;
}

export interface BaseRouteSegment {
  type: 'transit' | 'walk';
  stations: RouteStation[];
  duration: number; // in seconds
}

export interface TransitRouteSegment extends BaseRouteSegment {
  type: 'transit';
  line: TransitLine;
  stopWaitTime: number; // in seconds
  ticketCost: number;
}

export interface WalkingRouteSegment extends BaseRouteSegment {
  type: 'walk';
  walkingTime: number; // in seconds
  walkingDistance: number; // in meters
}

export type RouteSegment = TransitRouteSegment | WalkingRouteSegment;

export interface Route {
  id: string;
  segments: RouteSegment[];
  totalDuration: number;
  totalDistance: number;
  transfers: number;
  totalStops: number;
  requestedOrigin?: string;
  totalFare?: number;
}

export interface RoutingError {
  error: string;
  code: string;
}

export type RoutingResult = Route[] | RoutingError;

/**
 * Recommendation type for accessing stations at the start/end of a journey
 */
export type AccessType = 'walk' | 'public_transport';

/**
 * Access recommendation with distance information
 */
export interface AccessRecommendation {
  type: AccessType;
  distance: number; // in meters
  googleMapsUrl?: string; // Google Maps navigation URL
}

/**
 * Access recommendations for both origin and destination
 */
export interface AccessRecommendations {
  origin: AccessRecommendation;
  destination: AccessRecommendation;
}
