import { EdgeData } from './graph';

/**
 * Path finding weight strategy
 */
export interface PathStrategy {
  name: string;
  weight: (edge: string, attributes: EdgeData) => number;
  description: string;
}

/**
 * Collection of path finding strategies for route diversity
 */
export const PATH_STRATEGIES: PathStrategy[] = [
  // Standard duration-based strategy
  {
    name: 'standard',
    weight: (_edge: string, attributes: EdgeData) => attributes.duration,
    description: 'Standard duration-based shortest path',
  },

  // Minimize transfers (heavily penalize transfer edges)
  {
    name: 'minimizeTransfers',
    weight: (_edge: string, attributes: EdgeData) =>
      attributes.duration * (attributes.type === 'transfer' ? 5 : 1),
    description: 'Minimize transfers between transit lines',
  },

  // Prefer transit over walking (penalize walking edges)
  {
    name: 'preferTransit',
    weight: (_edge: string, attributes: EdgeData) =>
      attributes.duration * (attributes.type === 'walking' ? 2 : 1),
    description: 'Prefer transit travel over walking',
  },

  // Direct walking path when possible
  {
    name: 'preferWalking',
    weight: (_edge: string, attributes: EdgeData) =>
      attributes.duration * (attributes.type === 'walking' ? 0.8 : 1.5),
    description: 'Prefer walking when reasonable',
  },

  // Prioritize major interchange transfers
  {
    name: 'majorInterchanges',
    weight: (_edge: string, attributes: EdgeData) => {
      if (attributes.isMajorInterchange) {
        return attributes.duration * 0.5;
      } else if (attributes.type === 'transfer') {
        return attributes.duration * 3;
      } else if (
        attributes.type === 'transit' &&
        (attributes.lineId === 'red' ||
          attributes.lineId === 'orange' ||
          attributes.lineId === 'blue' ||
          attributes.lineId === 'green')
      ) {
        return attributes.duration * 0.9;
      }
      return attributes.duration;
    },
    description: 'Prioritize transfers at major interchanges',
  },

  // Prefer major transit lines
  {
    name: 'majorLines',
    weight: (_edge: string, attributes: EdgeData) => {
      const isMajorLine =
        attributes.lineId === 'red' ||
        attributes.lineId === 'orange' ||
        attributes.lineId === 'blue' ||
        attributes.lineId === 'green';

      if (attributes.type === 'transit' && isMajorLine) {
        return attributes.duration * 0.7;
      } else if (attributes.type === 'transit') {
        return attributes.duration * 1.5;
      }
      return attributes.duration;
    },
    description: 'Strongly prefer major transit lines',
  },
];
