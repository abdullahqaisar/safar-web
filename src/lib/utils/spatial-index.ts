import { Coordinates } from '@/types/station';
import { calculateHaversineDistance } from './geo';

export class SpatialIndex<T extends { coordinates: Coordinates }> {
  private grid: Map<string, T[]> = new Map();
  private items: T[] = [];
  private gridPrecision: number;
  private initialized = false;
  private boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null = null;

  constructor(gridPrecision = 0.01) {
    this.gridPrecision = gridPrecision;
  }

  add(item: T): void {
    const key = this.getCellKey(item.coordinates);
    this.items.push(item);

    // Update bounding box
    if (!this.boundingBox) {
      this.boundingBox = {
        minLat: item.coordinates.lat,
        maxLat: item.coordinates.lat,
        minLng: item.coordinates.lng,
        maxLng: item.coordinates.lng,
      };
    } else {
      this.boundingBox.minLat = Math.min(
        this.boundingBox.minLat,
        item.coordinates.lat
      );
      this.boundingBox.maxLat = Math.max(
        this.boundingBox.maxLat,
        item.coordinates.lat
      );
      this.boundingBox.minLng = Math.min(
        this.boundingBox.minLng,
        item.coordinates.lng
      );
      this.boundingBox.maxLng = Math.max(
        this.boundingBox.maxLng,
        item.coordinates.lng
      );
    }

    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }

    this.grid.get(key)!.push(item);
    this.initialized = true;
  }

  addAll(items: T[]): void {
    // Pre-calculate bounding box to avoid recalculating for each item
    if (items.length > 0) {
      this.boundingBox = items.reduce(
        (box, item) => ({
          minLat: Math.min(box.minLat, item.coordinates.lat),
          maxLat: Math.max(box.maxLat, item.coordinates.lat),
          minLng: Math.min(box.minLng, item.coordinates.lng),
          maxLng: Math.max(box.maxLng, item.coordinates.lng),
        }),
        {
          minLat: items[0].coordinates.lat,
          maxLat: items[0].coordinates.lat,
          minLng: items[0].coordinates.lng,
          maxLng: items[0].coordinates.lng,
        }
      );
    }

    // Batch add items to grid cells
    const cellMap = new Map<string, T[]>();
    items.forEach((item) => {
      const key = this.getCellKey(item.coordinates);
      if (!cellMap.has(key)) {
        cellMap.set(key, []);
      }
      cellMap.get(key)!.push(item);
    });

    // Update the grid
    cellMap.forEach((cellItems, key) => {
      const existingItems = this.grid.get(key) || [];
      this.grid.set(key, [...existingItems, ...cellItems]);
    });

    this.items.push(...items);
    this.initialized = true;
  }

  findWithinRadius(center: Coordinates, radiusMeters: number): T[] {
    if (!this.initialized || this.items.length === 0) return [];

    // Quick rejection if center is far from the dataset bounding box
    if (this.boundingBox && this.isOutsideBoundingBox(center, radiusMeters)) {
      return [];
    }

    const radiusInDegrees = radiusMeters / 111320;

    // Adjust longitude span based on latitude to account for Earth's curvature
    const latCosine = Math.cos((center.lat * Math.PI) / 180);
    // Prevent division by very small numbers near poles
    const lngFactor = Math.max(latCosine, 0.01);

    const minLat = center.lat - radiusInDegrees;
    const maxLat = center.lat + radiusInDegrees;
    const minLng = center.lng - radiusInDegrees / lngFactor;
    const maxLng = center.lng + radiusInDegrees / lngFactor;

    const minCellLat = Math.floor(minLat / this.gridPrecision);
    const maxCellLat = Math.ceil(maxLat / this.gridPrecision);
    const minCellLng = Math.floor(minLng / this.gridPrecision);
    const maxCellLng = Math.ceil(maxLng / this.gridPrecision);

    const candidates: T[] = [];
    // Check if the area is too large, which might indicate a problem
    const cellCount =
      (maxCellLat - minCellLat + 1) * (maxCellLng - minCellLng + 1);
    const maxCells = 100; // Reasonable limit to prevent excessive cell checking

    if (cellCount > maxCells && this.items.length < 1000) {
      // Fall back to checking all items for small datasets when area is too large
      return this.items.filter(
        (item) =>
          calculateHaversineDistance(center, item.coordinates) <= radiusMeters
      );
    }

    // Otherwise collect items from relevant grid cells
    for (let lat = minCellLat; lat <= maxCellLat; lat++) {
      for (let lng = minCellLng; lat <= maxCellLng; lng++) {
        const key = `${lat}:${lng}`;
        const cell = this.grid.get(key);
        if (cell) candidates.push(...cell);
      }
    }

    // If we found no candidates or too many, check all items
    // but adjust the threshold to be more reasonable
    if (
      candidates.length === 0 ||
      (candidates.length > this.items.length * 0.5 && this.items.length < 500)
    ) {
      return this.items.filter(
        (item) =>
          calculateHaversineDistance(center, item.coordinates) <= radiusMeters
      );
    }

    return candidates.filter(
      (item) =>
        calculateHaversineDistance(center, item.coordinates) <= radiusMeters
    );
  }

  findNearest(
    center: Coordinates,
    k = 1,
    maxRadiusMeters = Infinity
  ): Array<{ item: T; distance: number }> {
    if (!this.initialized || this.items.length === 0) return [];

    // For small datasets, just check all items for absolute accuracy
    if (this.items.length <= 500) {
      return this.items
        .map((item) => ({
          item,
          distance: calculateHaversineDistance(center, item.coordinates),
        }))
        .filter((result) => result.distance <= maxRadiusMeters)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, k);
    }

    // Set initial search radius - ensure it's not too small
    const initialRadius =
      maxRadiusMeters === Infinity
        ? 500
        : Math.min(Math.max(maxRadiusMeters / 4, 250), maxRadiusMeters);

    let searchRadius = initialRadius;
    const allResults: T[] = [];
    const processedItemIds = new Set<string>();

    // If we didn't find enough results, expand the search radius with multiple passes
    const maxPasses = 4;
    let currentPass = 1;

    while (
      allResults.length < k &&
      searchRadius <= maxRadiusMeters &&
      currentPass <= maxPasses
    ) {
      // Get items within current radius
      const newResults = this.findWithinRadius(center, searchRadius);

      // Add only new items (not already processed)
      for (const item of newResults) {
        // Use a unique identifier for the item - assuming coordinates can be used
        const itemId = `${item.coordinates.lat},${item.coordinates.lng}`;
        if (!processedItemIds.has(itemId)) {
          allResults.push(item);
          processedItemIds.add(itemId);
        }
      }

      // Exponentially increase search radius for next pass
      searchRadius = Math.min(searchRadius * 2, maxRadiusMeters);
      currentPass++;
    }

    // Calculate distance for all accumulated results, sort by distance, and return top k
    return allResults
      .map((item) => ({
        item,
        distance: calculateHaversineDistance(center, item.coordinates),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);
  }

  private getCellKey(coordinates: Coordinates): string {
    const latCell = Math.floor(coordinates.lat / this.gridPrecision);
    const lngCell = Math.floor(coordinates.lng / this.gridPrecision);
    return `${latCell}:${lngCell}`;
  }

  private isOutsideBoundingBox(
    center: Coordinates,
    radiusMeters: number
  ): boolean {
    if (!this.boundingBox) return false;

    const radiusInDegrees = radiusMeters / 111320;

    // Check if the search area is completely outside the dataset bounding box
    return (
      center.lat - radiusInDegrees > this.boundingBox.maxLat ||
      center.lat + radiusInDegrees < this.boundingBox.minLat ||
      center.lng - radiusInDegrees > this.boundingBox.maxLng ||
      center.lng + radiusInDegrees < this.boundingBox.minLng
    );
  }

  clear(): void {
    this.grid.clear();
    this.items = [];
    this.boundingBox = null;
    this.initialized = false;
  }

  /**
   * Get all items in the index
   */
  getAll(): T[] {
    return [...this.items];
  }
}
