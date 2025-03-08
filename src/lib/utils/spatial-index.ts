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

    const minLat = center.lat - radiusInDegrees;
    const maxLat = center.lat + radiusInDegrees;
    const minLng =
      center.lng - radiusInDegrees / Math.cos((center.lat * Math.PI) / 180);
    const maxLng =
      center.lng + radiusInDegrees / Math.cos((center.lat * Math.PI) / 180);

    const minCellLat = Math.floor(minLat / this.gridPrecision);
    const maxCellLat = Math.ceil(maxLat / this.gridPrecision);
    const minCellLng = Math.floor(minLng / this.gridPrecision);
    const maxCellLng = Math.ceil(maxLng / this.gridPrecision);

    const candidates: T[] = [];
    for (let lat = minCellLat; lat <= maxCellLat; lat++) {
      for (let lng = minCellLng; lng <= maxCellLng; lng++) {
        const key = `${lat}:${lng}`;
        const cell = this.grid.get(key);
        if (cell) candidates.push(...cell);
      }
    }

    if (
      candidates.length === 0 ||
      (candidates.length > this.items.length * 0.25 && this.items.length < 1000)
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

    // Adaptive search radius strategy with multiple passes
    let searchRadius =
      maxRadiusMeters === Infinity ? 500 : Math.min(2000, maxRadiusMeters / 2);
    let results = this.findWithinRadius(center, searchRadius);

    // If we didn't find enough results, expand the search radius with multiple passes
    const maxPasses = 4;
    let currentPass = 1;

    while (
      results.length < k &&
      searchRadius < maxRadiusMeters &&
      currentPass <= maxPasses
    ) {
      // Exponentially increase search radius up to the max
      searchRadius = Math.min(searchRadius * 2, maxRadiusMeters);
      results = this.findWithinRadius(center, searchRadius);
      currentPass++;
    }

    // Calculate distance for each result, sort by distance, and return top k
    return results
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
