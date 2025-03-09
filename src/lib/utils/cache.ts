import { Coordinates } from '@/types/station';
import { Route } from '@/types/route';
import Graph from 'graphology';

// Cache TTL constants
const ROUTE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Route cache implementation
class RouteCache {
  private cache = new Map<string, { timestamp: number; routes: Route[] }>();

  createKey(from: Coordinates, to: Coordinates): string {
    return `${from.lat},${from.lng}_${to.lat},${to.lng}}`;
  }

  get(key: string): Route[] | null {
    this.cleanup();
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ROUTE_CACHE_TTL) {
      return cached.routes;
    }
    return null;
  }

  set(key: string, routes: Route[]): void {
    this.cache.set(key, { timestamp: Date.now(), routes });
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, { timestamp }] of this.cache.entries()) {
      if (now - timestamp > ROUTE_CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Simple in-memory cache for the transit graph
 */
class GraphCache {
  private graph: Graph | null = null;
  private lastUpdated: number = 0;
  private readonly cacheLifetime = 3600000; // 1 hour in milliseconds

  /**
   * Get the cached graph if it exists and is valid
   */
  get(): Graph | null {
    if (!this.graph) {
      return null;
    }

    const now = Date.now();
    if (now - this.lastUpdated > this.cacheLifetime) {
      this.graph = null;
      return null;
    }

    return this.graph;
  }

  /**
   * Set the graph in the cache
   */
  set(graph: Graph): void {
    this.graph = graph;
    this.lastUpdated = Date.now();
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.graph = null;
  }
}

export const graphCache = new GraphCache();

/**
 * General purpose cache for API responses
 */
export class ResponseCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private readonly cacheLifetime: number;

  constructor(cacheLifetimeMs: number = 60000) {
    this.cacheLifetime = cacheLifetimeMs;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheLifetime) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const routeCache = new RouteCache();
