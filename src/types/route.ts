import { Station } from '@/types/station';

export interface Route {
  id?: string;
  segments: RouteSegment[];
  totalDuration: number;
  totalDistance: number;
  totalStops: number;
  transfers: number;
  isDirectWalk?: boolean;
  isShortWalk?: boolean;
  isMediumWalk?: boolean;
  isLongWalk?: boolean;
  directDistance?: number;
}

export type RouteSegment = TransitSegment | WalkSegment;

export interface BaseSegment {
  type: 'transit' | 'walk';
  duration: number;
  stations: Station[];
}

export interface TransitSegment extends BaseSegment {
  type: 'transit';
  line: {
    id: string;
    name: string;
    color: string;
  };
  stopWaitTime: number;
}

export interface WalkSegment extends BaseSegment {
  type: 'walk';
  walkingTime: number;
  walkingDistance: number;
  isShortcut?: boolean;
  isExplicitShortcut?: boolean;
  priority?: number;
  isAccessWalk?: boolean; // New property to identify initial/final walks
}
