import Graph from 'graphology';
import {
  Station,
  TransitLine,
  Connection,
  WalkingShortcut,
  NetworkGraph,
  Coordinates,
} from '../types/graph';
import {
  DEFAULT_STOP_WAIT_TIME,
  WALKING_MAX_DISTANCE,
} from '../utils/constants';

import { getCellKey, calculateWalkingPriority } from '../utils/graph-utils';
import {
  calculateTransitTime,
  calculateWalkingTime,
} from '../utils/time-utils';
import {
  MAJOR_INTERCHANGES,
  walkingShortcuts as predefinedWalkingShortcuts,
} from '../data/metro-data';
import { calculateDistance } from '../utils/geo-utils';

type GridKey = string;
type SpatialIndex = Map<GridKey, string[]>;

export class TransitGraph {
  graph: Graph;
  stations: Record<string, Station> = {};
  lines: Record<string, TransitLine> = {};
  interchangePoints: string[] = [];
  walkingShortcuts: WalkingShortcut[] = [];
  connectivityMatrix: Record<string, Record<string, boolean>> = {};
  spatialIndex: SpatialIndex = new Map();
  stationLines: Record<string, string[]> = {}; // Track which lines each station belongs to
  transferStations: Map<string, string[]> = new Map(); // NEW: Track stations that serve as transfer points

  constructor() {
    this.graph = new Graph({ multi: true, type: 'directed' });
  }

  initialize(stations: Station[], lines: TransitLine[]): void {
    console.log(
      `[Graph] Initializing graph with ${stations.length} stations and ${lines.length} lines`
    );
    this.graph = new Graph({ multi: true, type: 'directed' });
    this.stations = {};
    this.lines = {};
    this.interchangePoints = [];
    this.walkingShortcuts = [];
    this.connectivityMatrix = {};
    this.spatialIndex = new Map();
    this.stationLines = {};
    this.transferStations = new Map(); // Reset transfer stations

    // Add stations to the graph
    stations.forEach((station) => {
      this.stations[station.id] = station;
      this.graph.addNode(station.id, {
        ...station,
        type: 'station',
      });
      this.addToSpatialIndex(station.id, station.coordinates);

      // Initialize empty array for station lines
      this.stationLines[station.id] = [];
      this.transferStations.set(station.id, []); // Initialize empty array for transfer stations
    });

    // Process lines and track which stations belong to which lines
    lines.forEach((line) => {
      this.lines[line.id] = line;
      console.log(
        `[Graph] Adding line: ${line.id} (${line.name}) with ${line.stations.length} stations`
      );

      // Track which lines each station belongs to
      line.stations.forEach((stationId) => {
        if (this.stationLines[stationId]) {
          this.stationLines[stationId].push(line.id);
        }

        // Track transfer stations
        if (this.transferStations.has(stationId)) {
          const lineArray = this.transferStations.get(stationId)!;
          if (!lineArray.includes(line.id)) {
            lineArray.push(line.id);
          }
        }
      });

      // Create edges between stations on the same line
      for (let i = 0; i < line.stations.length - 1; i++) {
        const fromId = line.stations[i];
        const toId = line.stations[i + 1];

        if (!this.stations[fromId] || !this.stations[toId]) continue;

        const from = this.stations[fromId];
        const to = this.stations[toId];

        const distance = calculateDistance(from.coordinates, to.coordinates);
        const duration = calculateTransitTime(distance);

        this.graph.addEdge(fromId, toId, {
          type: 'transit',
          lineId: line.id,
          distance,
          duration,
          stopWaitTime: DEFAULT_STOP_WAIT_TIME,
        });
      }
    });

    // Precompute additional data
    this.identifyInterchangePoints();
    this.calculateWalkingShortcuts();
    this.buildConnectivityMatrix();

    console.log(
      `[Graph] Graph initialization complete with ${Object.keys(this.stations).length} stations, ${Object.keys(this.lines).length} lines, ${this.interchangePoints.length} interchanges, and ${this.walkingShortcuts.length} walking shortcuts`
    );
  }

  /**
   * Identify stations that serve as interchange points between lines
   */
  identifyInterchangePoints(): void {
    this.interchangePoints = [];

    // 1. First add stations from MAJOR_INTERCHANGES as defined in metro data
    MAJOR_INTERCHANGES.forEach((interchange) => {
      const { stationId } = interchange;

      if (this.stations[stationId]) {
        // Mark as interchange
        this.interchangePoints.push(stationId);
        this.stations[stationId].isInterchange = true;
        this.graph.setNodeAttribute(stationId, 'isInterchange', true);
        console.log(
          `[Graph] Marked major interchange: ${stationId} (${this.stations[stationId].name})`
        );
      }
    });

    // 2. Then find additional interchanges based on station presence on multiple lines
    Object.entries(this.stationLines).forEach(([stationId, lines]) => {
      // If station serves multiple lines and isn't already marked as interchange
      if (lines.length > 1 && !this.stations[stationId].isInterchange) {
        this.interchangePoints.push(stationId);
        this.stations[stationId].isInterchange = true;
        this.graph.setNodeAttribute(stationId, 'isInterchange', true);
        console.log(
          `[Graph] Marked additional interchange: ${stationId} (${this.stations[stationId].name}) serving lines: ${lines.join(', ')}`
        );
      }
    });

    console.log(
      `[Graph] Total interchange points identified: ${this.interchangePoints.length}`
    );
  }

  /**
   * Calculate walking shortcuts between stations using predefined walkingShortcuts
   */
  calculateWalkingShortcuts(): void {
    this.walkingShortcuts = [];
    console.log('[Graph] Starting walking shortcuts calculation');

    // Use predefined walking shortcuts from metro-data.ts
    predefinedWalkingShortcuts.forEach((shortcut) => {
      const { from, to, priority } = shortcut;
      console.log(
        `[Graph] Processing walking shortcut: ${from} → ${to} (priority: ${priority})`
      );

      // Get the station objects
      const fromStation = this.stations[from];
      const toStation = this.stations[to];

      if (!fromStation || !toStation) {
        console.warn(
          `[Graph] Invalid shortcut stations: ${from}-${to}. Station not found.`
        );
        return;
      }

      // Calculate the distance and duration
      const distance = calculateDistance(
        fromStation.coordinates,
        toStation.coordinates
      );

      // If distance exceeds max walking distance, skip (shouldn't happen with predefined shortcuts)
      if (distance > WALKING_MAX_DISTANCE) {
        console.warn(
          `[Graph] Walking shortcut ${from}-${to} exceeds maximum walking distance (${Math.round(
            distance
          )}m)`
        );
        return;
      }

      // Calculate walking time based on distance
      const walkingTime = calculateWalkingTime(distance);
      console.log(
        `[Graph] Shortcut ${from} (${fromStation.name}) → ${to} (${toStation.name}): distance=${Math.round(distance)}m, time=${Math.round(walkingTime)}s, priority=${priority}`
      );

      // Create a walking shortcut
      const walkingShortcut: WalkingShortcut = {
        from,
        to,
        distance,
        duration: walkingTime,
        priority:
          priority ||
          calculateWalkingPriority(fromStation, toStation, distance, this),
      };

      // Add the shortcut
      this.walkingShortcuts.push(walkingShortcut);
      console.log(
        `[Graph] Added walking shortcut: ${from} (${fromStation.name}) → ${to} (${toStation.name})`
      );

      // Add bidirectional walking edges to graph (unless it's a one-way shortcut)
      this.graph.addEdge(from, to, {
        type: 'walking',
        distance,
        duration: walkingTime,
      });

      // Add reverse shortcut too (both directions)
      const reverseShortcut: WalkingShortcut = {
        from: to,
        to: from,
        distance,
        duration: walkingTime,
        priority:
          priority ||
          calculateWalkingPriority(toStation, fromStation, distance, this),
      };

      this.walkingShortcuts.push(reverseShortcut);
      console.log(
        `[Graph] Added reverse walking shortcut: ${to} (${toStation.name}) → ${from} (${fromStation.name})`
      );

      this.graph.addEdge(to, from, {
        type: 'walking',
        distance,
        duration: walkingTime,
      });
    });

    console.log(
      `[Graph] Total walking shortcuts created: ${this.walkingShortcuts.length}`
    );
  }

  /**
   * Add a station to the spatial index
   */
  private addToSpatialIndex(stationId: string, coordinates: Coordinates): void {
    const cellKey = getCellKey(coordinates);

    if (!this.spatialIndex.has(cellKey)) {
      this.spatialIndex.set(cellKey, []);
    }

    const stationIds = this.spatialIndex.get(cellKey)!;
    stationIds.push(stationId);
  }

  /**
   * Build connectivity matrix for quick lookups
   */
  buildConnectivityMatrix(): void {
    const stationIds = Object.keys(this.stations);

    // Initialize matrix
    stationIds.forEach((fromId) => {
      this.connectivityMatrix[fromId] = {};
      stationIds.forEach((toId) => {
        this.connectivityMatrix[fromId][toId] = false;
      });
    });

    // Fill matrix based on edge existence
    stationIds.forEach((fromId) => {
      // Set direct connections from graph edges
      this.graph.forEachOutNeighbor(fromId, (toId) => {
        this.connectivityMatrix[fromId][toId] = true;
      });
    });

    console.log(
      `[Graph] Built connectivity matrix for ${stationIds.length} stations`
    );
  }

  /**
   * Export the graph data structure
   */
  exportGraph(): NetworkGraph {
    return {
      stations: this.stations,
      lines: this.lines,
      connections: this.getConnections(),
      walkingShortcuts: this.walkingShortcuts,
      interchangePoints: this.interchangePoints,
      connectivityMatrix: this.connectivityMatrix,
    };
  }

  /**
   * Extract all connections from the graph
   */
  private getConnections(): Connection[] {
    const connections: Connection[] = [];

    this.graph.forEachEdge((edge, attributes, source, target) => {
      if (attributes.type === 'transit') {
        connections.push({
          from: source,
          to: target,
          lineId: attributes.lineId,
          distance: attributes.distance,
          duration: attributes.duration,
        });
      }
    });

    return connections;
  }

  /**
   * Check if a station serves as a transfer point between lines
   */
  isTransferStation(stationId: string): boolean {
    return (
      this.transferStations.has(stationId) &&
      this.transferStations.get(stationId)!.length > 1
    );
  }

  /**
   * Get lines that a particular station serves
   */
  getStationLines(stationId: string): string[] {
    return this.stationLines[stationId] || [];
  }
}
