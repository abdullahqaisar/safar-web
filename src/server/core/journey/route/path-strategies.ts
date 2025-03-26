import { EdgeData } from './graph';
import { getLineClass, LineClass } from '../../shared/line-utils';
import Graph from 'graphology';
import { NodeData } from './graph';
import { LINE_PRIORITY } from '@/lib/constants/route-config';

/**
 * Path finding weight strategy
 */
export interface PathStrategy {
  name: string;
  weight: (
    edge: string,
    attributes: EdgeData,
    source?: string,
    target?: string,
    graph?: Graph<NodeData, EdgeData>
  ) => number;
  description: string;
}

/**
 * Get line-specific weight multiplier based on classification
 */
function getLineWeightMultiplier(
  lineId: string | undefined,
  strategy: string
): number {
  const lineClass = getLineClass(lineId);

  switch (strategy) {
    case 'preferPrimary':
      if (lineClass === LineClass.PRIMARY) return 0.6; // More aggressive (was 0.7)
      if (lineClass === LineClass.SECONDARY) return 1.3;
      return 2.0; // Tertiary lines

    case 'preferSecondary':
      if (lineClass === LineClass.SECONDARY) return 0.7;
      if (lineClass === LineClass.PRIMARY) return 1.2;
      return 1.5; // Tertiary lines

    case 'balancedCoverage':
      if (lineClass === LineClass.PRIMARY) return 0.8;
      if (lineClass === LineClass.SECONDARY) return 0.9;
      return 1.0; // Tertiary lines get no penalty

    case 'minimizeTransfers':
      return 1.0; // No line-specific penalties

    default:
      return 1.0;
  }
}

/**
 * Calculate line priority factor (higher priority = lower weight)
 */
function getLinePriorityFactor(lineId: string | undefined): number {
  if (!lineId) return 1.0;

  const priority = LINE_PRIORITY[lineId] || 0;
  if (priority >= 9) return 0.6; // Top priority lines
  if (priority >= 8) return 0.7; // High priority lines
  if (priority >= 6) return 0.8; // Medium-high priority lines
  if (priority >= 4) return 0.9; // Medium priority lines
  return 1.0; // Low priority lines
}

/**
 * Collection of path finding strategies for route diversity
 */
export const PATH_STRATEGIES: PathStrategy[] = [
  // Standard duration-based strategy
  {
    name: 'standard',
    weight: (_edge: string, attributes: EdgeData) =>
      attributes.duration * (attributes.costMultiplier || 1.0), // Always apply costMultiplier
    description: 'Standard duration-based shortest path',
  },

  // Prefer primary (main metro) lines
  {
    name: 'preferPrimary',
    weight: (_edge: string, attributes: EdgeData) => {
      if (attributes.type === 'transit') {
        return (
          attributes.duration *
          getLineWeightMultiplier(attributes.lineId, 'preferPrimary') *
          (attributes.costMultiplier || 1.0) // Always apply costMultiplier
        );
      } else if (attributes.type === 'transfer') {
        // More emphasis on transfer cost multiplier
        return attributes.duration * (attributes.costMultiplier || 2.0);
      }
      return attributes.duration * 1.5; // Slightly penalize walking
    },
    description: 'Strongly prefer primary metro lines',
  },

  // Prefer secondary (major feeder) routes
  {
    name: 'preferSecondary',
    weight: (_edge: string, attributes: EdgeData) => {
      if (attributes.type === 'transit') {
        return (
          attributes.duration *
          getLineWeightMultiplier(attributes.lineId, 'preferSecondary') *
          (attributes.costMultiplier || 1.0) // Always apply costMultiplier
        );
      } else if (attributes.type === 'transfer') {
        return attributes.duration * (attributes.costMultiplier || 2.5);
      }
      return attributes.duration * 1.2; // Slight penalty for walking
    },
    description: 'Prefer secondary feeder routes',
  },

  // Minimize transfers (heavily penalize transfer edges)
  {
    name: 'minimizeTransfers',
    weight: (_edge: string, attributes: EdgeData) => {
      let baseTransferPenalty = attributes.type === 'transfer' ? 5 : 1;

      // Reduce penalty for critical transfers
      if (attributes.type === 'transfer' && attributes.isCriticalTransfer) {
        baseTransferPenalty = 2; // Lower penalty for critical transfers
      }

      return (
        attributes.duration *
        baseTransferPenalty *
        (attributes.costMultiplier || 1.0)
      );
    },
    description: 'Minimize transfers between transit lines',
  },

  // Balanced line coverage
  {
    name: 'balancedCoverage',
    weight: (_edge: string, attributes: EdgeData) => {
      if (attributes.type === 'transit') {
        return (
          attributes.duration *
          getLineWeightMultiplier(attributes.lineId, 'balancedCoverage') *
          (attributes.costMultiplier || 1.0) // Always apply costMultiplier
        );
      } else if (attributes.type === 'walking') {
        return attributes.duration * 1.5; // Moderate penalty for walking
      }

      // Apply cost multiplier for transfers
      return attributes.duration * (attributes.costMultiplier || 1.5);
    },
    description: 'Balance coverage of different line types',
  },

  // Prefer transit over walking
  {
    name: 'preferTransit',
    weight: (_edge: string, attributes: EdgeData) =>
      attributes.duration *
      (attributes.type === 'walking' ? 2 : 1) *
      (attributes.costMultiplier || 1.0), // Always apply costMultiplier
    description: 'Prefer transit travel over walking',
  },

  // Direct walking path when possible
  {
    name: 'preferWalking',
    weight: (_edge: string, attributes: EdgeData) =>
      attributes.duration *
      (attributes.type === 'walking' ? 0.8 : 1.5) *
      (attributes.costMultiplier || 1.0), // Always apply costMultiplier
    description: 'Prefer walking when reasonable',
  },

  // Prioritize major interchange transfers - enhanced version
  {
    name: 'majorInterchanges',
    weight: (_edge: string, attributes: EdgeData) => {
      if (attributes.isCriticalTransfer) {
        // Much more aggressive for critical transfers
        return attributes.duration * 0.2;
      } else if (attributes.isMajorInterchange) {
        return attributes.duration * 0.5;
      } else if (attributes.type === 'transfer') {
        return attributes.duration * 3;
      } else if (attributes.type === 'transit') {
        // Apply line priority factors
        return attributes.duration * getLinePriorityFactor(attributes.lineId);
      }

      // Always apply the cost multiplier
      return attributes.duration * (attributes.costMultiplier || 1.0);
    },
    description: 'Prioritize transfers at major interchanges',
  },

  // Critical connections strategy - specifically for key transit corridors
  {
    name: 'criticalConnections',
    weight: (
      _edge: string,
      attributes: EdgeData,
      source?: string,
      target?: string,
      graph?: Graph<NodeData, EdgeData>
    ) => {
      // Heavily prioritize critical transfers
      if (attributes.isCriticalTransfer) {
        return attributes.duration * 0.1; // 90% reduction
      }

      // Prioritize transit on primary lines
      if (attributes.type === 'transit') {
        const lineId = attributes.lineId;
        const priority = lineId ? LINE_PRIORITY[lineId] || 0 : 0;

        if (priority >= 9) {
          return attributes.duration * 0.4; // Red and Orange lines
        } else if (priority >= 7) {
          return attributes.duration * 0.6; // Other primary lines
        }

        // Penalize transit on lower priority lines
        return attributes.duration * 1.5;
      }

      // Penalize general transfers
      if (attributes.type === 'transfer' && !attributes.isMajorInterchange) {
        return attributes.duration * 3.0;
      }

      // Always apply the cost multiplier
      return attributes.duration * (attributes.costMultiplier || 1.0);
    },
    description: 'Find routes using critical transit connections',
  },
];
