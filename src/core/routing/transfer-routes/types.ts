import { Route } from '../../types/route';

/**
 * Types related to transfer route finding
 */

/**
 * Represents the current state in the BFS algorithm for finding transfer routes
 */
export interface TransferState {
  stationId: string;
  lineId: string;
  transferCount: number;
  visitedStations: Set<string>;
  visitedLines: Set<string>;
  visitedStationLinePairs: Set<string>;
  path: {
    stationId: string;
    lineId: string;
    isTransfer: boolean;
  }[];
}

/**
 * Line priority entry used in BFS algorithm to prioritize lines
 */
export interface LinePriority {
  lineId: string;
  priority: number;
  allowTransfer: boolean;
}

/**
 * Network path structure returned from path finding algorithms
 */
export interface NetworkPathResult {
  paths: string[][];
  minTransfers: number;
}

/**
 * Transfer option used when evaluating multiple transfer points
 */
export interface TransferOption {
  route: Route;
  score: number;
  transferStationId: string;
}