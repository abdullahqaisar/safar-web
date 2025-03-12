import {
  point,
  featureCollection,
  buffer,
  pointsWithinPolygon,
} from '@turf/turf';
import { Coordinates } from '@/types/station';
import { calculateDistanceSync } from '@/server/core/shared/distance';
// Import GeoJSON namespace
import type { GeoJSON } from 'geojson';

export class SpatialIndex<T extends { coordinates: Coordinates }> {
  private items: T[] = [];
  // Fix the type to accept both Point and MultiPoint
  private pointFeatures: GeoJSON.FeatureCollection<
    GeoJSON.Point | GeoJSON.MultiPoint,
    { index: number }
  > | null = null;

  constructor() {}

  add(item: T): void {
    this.items.push(item);
    // Reset features collection since we've modified items
    this.pointFeatures = null;
  }

  addAll(items: T[]): void {
    this.items.push(...items);
    // Reset features collection since we've modified items
    this.pointFeatures = null;
  }

  private ensurePointFeaturesInitialized(): void {
    if (!this.pointFeatures) {
      // Create a GeoJSON feature collection with all points
      this.pointFeatures = featureCollection(
        this.items.map((item, index) =>
          point([item.coordinates.lng, item.coordinates.lat], { index })
        )
      );
    }
  }

  findWithinRadius(center: Coordinates, radiusMeters: number): T[] {
    if (this.items.length === 0) {
      return [];
    }

    this.ensurePointFeaturesInitialized();

    const centerPoint = point([center.lng, center.lat]);

    const circle = buffer(centerPoint, radiusMeters / 1000, {
      units: 'kilometers',
    });

    if (!circle) {
      return [];
    }

    const pointsWithin = pointsWithinPolygon(this.pointFeatures!, circle);

    return pointsWithin.features
      .filter(
        (feature) =>
          feature.properties &&
          typeof feature.properties.index === 'number' &&
          feature.properties.index >= 0 &&
          feature.properties.index < this.items.length
      )
      .map((feature) => this.items[feature.properties!.index]);
  }

  findNearest(
    center: Coordinates,
    k = 1,
    maxRadiusMeters = Infinity
  ): Array<{ item: T; distance: number }> {
    if (this.items.length === 0) {
      return [];
    }

    this.ensurePointFeaturesInitialized();

    // Create a center point for Turf operations
    const centerPoint = point([center.lng, center.lat]);

    // Fix the type definition to match what pointsWithinPolygon returns
    let searchFeatures: GeoJSON.FeatureCollection<
      GeoJSON.Point | GeoJSON.MultiPoint,
      { index: number }
    > = this.pointFeatures!;

    if (maxRadiusMeters < Infinity && maxRadiusMeters > 0) {
      const circle = buffer(centerPoint, maxRadiusMeters / 1000, {
        units: 'kilometers',
      });

      // Handle potential undefined result from buffer
      if (circle) {
        const pointsWithin = pointsWithinPolygon(this.pointFeatures!, circle);
        if (pointsWithin.features.length > 0) {
          // Now this assignment works because the types match
          searchFeatures = pointsWithin;
        }
      }
    }

    // Calculate distances for all features in the search space
    const withDistances = searchFeatures.features
      .filter(
        (feature) =>
          feature.properties &&
          typeof feature.properties.index === 'number' &&
          feature.properties.index >= 0 &&
          feature.properties.index < this.items.length
      )
      .map((feature) => {
        const itemIndex = feature.properties!.index;
        const item = this.items[itemIndex];

        // Use consistent distance calculation method
        const distanceInMeters = calculateDistanceSync(
          center,
          item.coordinates
        );

        return { item, distance: distanceInMeters };
      });

    // Sort by distance and return the k nearest
    return withDistances.sort((a, b) => a.distance - b.distance).slice(0, k);
  }

  clear(): void {
    this.items = [];
    this.pointFeatures = null;
  }

  getAll(): T[] {
    return [...this.items];
  }
}
