# Transfer Routes Module

## Overview
The Transfer Routes module provides functionality for finding transit routes that require transferring between different lines to reach a destination. It implements specialized algorithms for finding single-transfer and multi-transfer routes.

## Architecture
The module is organized into several logical components:

```
transfer-routes/
├── index.ts        # Main exports
├── finders.ts      # Entry point functions
├── single-transfer.ts  # Single transfer algorithm
├── multi-transfer.ts   # Multi-transfer algorithms
├── network-paths.ts    # Network path finding
├── types.ts        # Shared types
└── utils.ts        # Utility functions
```

## Key Algorithms

### Single Transfer Route Finding
For routes requiring exactly one transfer between two lines, we use an optimized algorithm that:
1. Identifies all possible transfer points between the lines
2. Evaluates each transfer option based on multiple factors:
   - Total journey time
   - Transfer station quality
   - Position of transfer station relative to origin and destination
3. Selects the optimal transfer point

### Multi-Transfer Route Finding
For more complex routes requiring multiple transfers, we use a breadth-first search (BFS) approach that:
1. Pre-analyzes the network to identify optimal paths
2. Conducts a guided BFS to explore potential routes
3. Prioritizes exploration of promising lines using network topology
4. Filters out unnecessary or sub-optimal transfers
5. Constructs valid routes from the discovered paths

### Network Path Analysis
Before performing the full BFS, we analyze the network structure to:
1. Determine the minimum number of transfers needed
2. Identify critical line sequences that might be part of optimal routes
3. Create a guide for the BFS to prioritize exploration

## Function Call Hierarchy

### Entry Point
- `findTransferRoutes` (finders.ts) - Main entry point called by route-discovery.ts
  - Calls `findSingleTransferRoutes`
  - Calls `findMultiTransferRoutes` if needed

### Single Transfer Routes
- `findSingleTransferRoutes` (single-transfer.ts) - Optimized algorithm for single transfer routes
  - Calls `findCommonStations` to identify transfer points
  - Calls `findBestTransferOption` to evaluate transfer options
    - Uses `createSegmentBetweenStations` to create route segments

### Multi-Transfer Routes
- `findMultiTransferRoutes` (multi-transfer.ts) - BFS algorithm for multi-transfer routes
  - Calls `findPossibleNetworkPaths` to analyze network structure
  - Uses various utility functions during BFS:
    - `hasUnnecessaryTransfers` to filter redundant transfers
    - `isOnNetworkPath` to validate against network paths
    - `hasCommonInterchange` to check for interchange possibilities
    - `hasNewReachableStations` to evaluate transfer value
    - `constructRouteFromPath` to build final routes

### Utility Functions
- `getStopsToDestination` (utils.ts) - Calculate stops between stations
- `hasUnnecessaryTransfers` (utils.ts) - Detect redundant transfers
- `findCommonStations` (utils.ts) - Find transfer stations between lines
- `createSegmentBetweenStations` (utils.ts) - Create route segments
- `constructRouteFromPath` (utils.ts) - Build complete routes from paths

## Key Types

### TransferState
```typescript
interface TransferState {
  stationId: string;
  lineId: string;
  transferCount: number;
  visitedStations: Set<string>;
  visitedLines: Set<string>;
  visitedStationLinePairs: Set<string>;
  path: {
    stationId: string;
    lineId: string;
    isTransfer: boolean;
  }[];
}
```

### NetworkPathResult
```typescript
interface NetworkPathResult {
  paths: string[][];
  minTransfers: number;
}
```

### TransferOption
```typescript
interface TransferOption {
  route: Route;
  score: number;
  transferStationId: string;
}
```

## Integration with Route Discovery

The Transfer Routes module is called by the Route Discovery system through the `findTransferRoutes` function. The route discovery process:

1. First attempts to find direct routes (no transfers)
2. If direct routes aren't sufficient, calls the transfer routes module
3. Uses duration thresholds to filter transfer routes that aren't significantly better than direct routes
4. Combines the results with walking routes to provide a complete set of route options

## Algorithms in Detail

### Single Transfer Algorithm
The single transfer algorithm is optimized for the common case of needing exactly one change between lines:

1. Get all lines that serve both the origin and destination stations
2. For each pair of lines (origin line to destination line):
   - Find common transfer stations where both lines intersect
   - For each transfer station, create potential route segments and evaluate
   - Score each transfer option based on multiple factors:
     - Total duration
     - Detour factor (how far out of the way the transfer takes you)
     - Transfer station quality (major interchanges preferred)
     - Number of available lines at the transfer station
   - Select the transfer option with the best score

### Multi-Transfer BFS Algorithm
The multi-transfer algorithm uses a guided BFS approach:

1. Analyze the network to find the minimum transfers needed and potential paths
2. Initialize the BFS queue with all lines at the origin station
3. For each state in the queue:
   - Check if we've reached the destination
   - Explore stations ahead on the current line (no transfer)
   - Consider transfers at the current station:
     - Prioritize lines based on proximity to destination
     - Filter out transfers that don't add value
     - Boost priority for transfers that follow optimal network paths
   - Add new states to the queue for viable transfers
4. Construct and validate routes from successful paths

### Network Path Analysis
Before the BFS, we analyze the network structure:

1. Use the transit graph's connectivity data to find the minimum transfers between any origin line and destination line
2. Perform a specialized BFS on the line network (not station network) to find optimal paths
3. Allow exploring near-optimal paths (up to one additional transfer) to ensure coverage
4. Return both the minimum transfers needed and the possible line sequences

## Performance Considerations

- Single transfer finding is highly optimized and runs first since it's the most common case
- Network path analysis provides critical guidance to the BFS to reduce unnecessary exploration
- Several pruning mechanisms are used during the BFS:
  - State deduplication using unique state identifiers
  - Priority-based exploration of promising lines
  - Early filtering of unnecessary transfers
  - Validation of path value using network topology

This approach allows efficiently finding optimal transfer routes even in complex transit networks. 