/**
 * Generic priority queue implementation for path finding algorithms
 */
export class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];
  private keyMap: Map<string, number> = new Map(); // Maps keys to their indexes

  constructor(private getKey: (element: T) => string) {}

  push(element: T, priority: number): boolean {
    const key = this.getKey(element);
    const existingIndex = this.keyMap.has(key)
      ? this.items.findIndex((item, i) => this.getKey(item.element) === key)
      : -1;

    // If element exists with higher priority, update it
    if (existingIndex !== -1) {
      if (this.items[existingIndex].priority <= priority) {
        return false; // Already have a better path
      }
      // Remove the existing element
      this.items.splice(existingIndex, 1);
      this.keyMap.delete(key);
    }

    // Insert in correct position using binary search
    let low = 0;
    let high = this.items.length - 1;
    let insertIndex = this.items.length;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.items[mid].priority > priority) {
        insertIndex = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    this.items.splice(insertIndex, 0, { element, priority });
    this.keyMap.set(key, insertIndex);

    // Update indexes in the map
    for (let i = insertIndex + 1; i < this.items.length; i++) {
      this.keyMap.set(this.getKey(this.items[i].element), i);
    }

    return true;
  }

  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items.shift();
    if (item) {
      this.keyMap.delete(this.getKey(item.element));
      // Update all indexes after removal
      for (let i = 0; i < this.items.length; i++) {
        this.keyMap.set(this.getKey(this.items[i].element), i);
      }
      return item.element;
    }
    return undefined;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  contains(key: string): boolean {
    return this.keyMap.has(key);
  }
}

/**
 * A generic A* path finding implementation
 */
export class AStarPathFinder<T> {
  private openSet: PriorityQueue<T>;
  private closedSet: Set<string>;
  private cameFrom: Map<string, T> = new Map();
  private gScore: Map<string, number> = new Map(); // Cost from start to node
  private fScore: Map<string, number> = new Map(); // Estimated total cost from start to goal through node

  constructor(
    private getKey: (node: T) => string,
    private getNeighbors: (node: T) => T[],
    private heuristic: (node: T, goal: T) => number,
    private getCost: (from: T, to: T) => number,
    private isGoal: (node: T, goal: T) => boolean
  ) {
    this.openSet = new PriorityQueue<T>(getKey);
    this.closedSet = new Set<string>();
  }

  findPath(start: T, goal: T, maxIterations: number = 10000): T[] {
    // Clear previous search state
    this.openSet = new PriorityQueue<T>(this.getKey);
    this.closedSet = new Set<string>();
    this.cameFrom = new Map();
    this.gScore = new Map();
    this.fScore = new Map();

    const startKey = this.getKey(start);

    // Initialize scores
    this.gScore.set(startKey, 0);
    this.fScore.set(startKey, this.heuristic(start, goal));

    // Add start node to open set
    this.openSet.push(start, this.fScore.get(startKey)!);

    let iterations = 0;

    while (!this.openSet.isEmpty() && iterations < maxIterations) {
      iterations++;

      // Get the node with lowest fScore
      const current = this.openSet.pop();
      if (!current) break;

      const currentKey = this.getKey(current);

      // Check if we've reached the goal
      if (this.isGoal(current, goal)) {
        return this.reconstructPath(current);
      }

      // Add current node to closed set
      this.closedSet.add(currentKey);

      // Process neighbors
      for (const neighbor of this.getNeighbors(current)) {
        const neighborKey = this.getKey(neighbor);

        // Skip if neighbor is already evaluated
        if (this.closedSet.has(neighborKey)) continue;

        // Calculate tentative gScore
        const tentativeGScore =
          (this.gScore.get(currentKey) || Infinity) +
          this.getCost(current, neighbor);

        // Skip if this path is worse than already found
        if (tentativeGScore >= (this.gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        // This path is better, record it
        this.cameFrom.set(neighborKey, current);
        this.gScore.set(neighborKey, tentativeGScore);
        this.fScore.set(
          neighborKey,
          tentativeGScore + this.heuristic(neighbor, goal)
        );

        // Add to open set with priority based on fScore
        this.openSet.push(neighbor, this.fScore.get(neighborKey)!);
      }
    }

    // No path found
    return [];
  }

  /**
   * Reconstructs path from start to current node using the cameFrom map
   */
  private reconstructPath(current: T): T[] {
    const path: T[] = [current];
    let currentKey = this.getKey(current);

    while (this.cameFrom.has(currentKey)) {
      const previous = this.cameFrom.get(currentKey)!;
      path.unshift(previous);
      currentKey = this.getKey(previous);
    }

    return path;
  }

  /**
   * Gets the total cost of the path found
   */
  getPathCost(node: T): number {
    return this.gScore.get(this.getKey(node)) || Infinity;
  }

  /**
   * Gets the number of nodes explored during the search
   */
  getExploredCount(): number {
    return this.closedSet.size;
  }
}

/**
 * Additional utility for weighted A* search - for transit networks where
 * transfer penalties or wait times might be important
 */
export class WeightedAStarPathFinder<T> extends AStarPathFinder<T> {
  constructor(
    getKey: (node: T) => string,
    getNeighbors: (node: T) => T[],
    heuristic: (node: T, goal: T) => number,
    getCost: (from: T, to: T) => number,
    isGoal: (node: T, goal: T) => boolean,
    private heuristicWeight: number = 1.2 // Weight > 1 makes algorithm favor goals
  ) {
    super(
      getKey,
      getNeighbors,
      (node, goal) => heuristicWeight * heuristic(node, goal),
      getCost,
      isGoal
    );
  }
}

/**
 * Dijkstra algorithm implementation - A* with 0 heuristic
 */
export class DijkstraPathFinder<T> extends AStarPathFinder<T> {
  constructor(
    getKey: (node: T) => string,
    getNeighbors: (node: T) => T[],
    getCost: (from: T, to: T) => number,
    isGoal: (node: T, goal: T) => boolean
  ) {
    super(
      getKey,
      getNeighbors,
      () => 0, // Zero heuristic makes this Dijkstra's
      getCost,
      isGoal
    );
  }
}
