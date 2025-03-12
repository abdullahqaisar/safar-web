import { Route } from '@/types/route';
import { Coordinates } from '@/types/station';
import Graph from 'graphology';
import { NodeData, EdgeData } from '@/server/core/journey/route/graph';

/**
 * Cache for route data with expiration
 */
export class RouteCache {
  private cache = new Map<string, { data: Route[]; timestamp: number }>();
  private readonly maxAge: number;

  constructor(maxAgeMinutes = 10) {
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  /**
   * Create a consistent cache key from coordinates
   */
  createKey(origin: Coordinates, destination: Coordinates): string {
    return `${origin.lat.toFixed(5)},${origin.lng.toFixed(
      5
    )}|${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
  }

  /**
   * Get cached routes if available and not expired
   */
  get(key: string): Route[] | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Store routes in cache
   */
  set(key: string, data: Route[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Cache for distance matrix API responses
 */
export class DistanceCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly maxAge: number;

  constructor(maxAgeMinutes = 60) {
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;
    return item.data;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

/**
 * Cache for transit graph
 */
class GraphCache {
  private graph: Graph<NodeData, EdgeData> | null = null;
  private timestamp: number = 0;
  private readonly MAX_AGE = 3600000; // 1 hour in milliseconds

  set(graph: Graph<NodeData, EdgeData>): void {
    this.graph = graph;
    this.timestamp = Date.now();
  }

  get(): Graph<NodeData, EdgeData> | null {
    if (!this.graph) return null;

    const age = Date.now() - this.timestamp;
    if (age > this.MAX_AGE) {
      this.graph = null;
      return null;
    }

    return this.graph;
  }
}

// Singleton instances
export const routeCache = new RouteCache();
export const distanceCache = new DistanceCache();
export const graphCache = new GraphCache();
