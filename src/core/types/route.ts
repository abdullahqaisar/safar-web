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
}

export interface RoutingError {
  error: string;
  code: string;
}

export type RoutingResult = Route[] | RoutingError;
