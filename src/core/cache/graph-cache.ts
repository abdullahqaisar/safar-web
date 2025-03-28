import { TransitGraph } from '../graph/graph';
import { metroLines } from '../data/metro-data';
import { stationData } from '../data/station-data';

// Cache variables
let graphInstance: TransitGraph | null = null;
let creationTimestamp: number | null = null;

// Cache expiration: 7 days in milliseconds
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if the cached graph has expired
 */
function isCacheExpired(): boolean {
  if (!creationTimestamp) return true;

  const now = Date.now();
  const ageMs = now - creationTimestamp;

  return ageMs > CACHE_EXPIRATION_MS;
}

/**
 * Get the transit graph from cache or create a new one if needed
 */
export function getGraph(): TransitGraph {
  // Check if we need to create or refresh the graph
  if (!graphInstance || isCacheExpired()) {
    console.log(
      `[GraphCache] ${
        graphInstance ? 'Refreshing expired' : 'Initializing new'
      } transit graph`
    );

    // Create new graph instance
    const graph = new TransitGraph();
    graph.initialize(stationData, metroLines);

    // Update cache
    graphInstance = graph;
    creationTimestamp = Date.now();

    console.log(
      `[GraphCache] Transit graph initialized with ${
        Object.keys(graph.stations).length
      } stations and ${Object.keys(graph.lines).length} lines`
    );

    return graph;
  }

  // Return cached instance
  return graphInstance;
}

/**
 * Force refresh the graph cache
 * Useful for manual refreshes or testing
 */
export function refreshGraph(): TransitGraph {
  // Clear the existing cache
  graphInstance = null;
  creationTimestamp = null;

  // Get a fresh graph
  return getGraph();
}
