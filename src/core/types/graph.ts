export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Station {
  id: string;
  name: string;
  coordinates: Coordinates;

  isInterchange?: boolean;
}

export interface TransitLine {
  id: string;
  name: string;
  color?: string;
  stations: string[]; // Ordered array of station IDs
  frequency?: string;
  schedule?: {
    first?: string;
    last?: string;
  };
  ticketCost?: number;
}

export interface Connection {
  from: string; // Station ID
  to: string; // Station ID
  lineId: string; // Transit line ID
  distance: number; // in meters
  duration: number; // in seconds
}

export interface WalkingShortcut {
  from: string; // Station ID
  to: string; // Station ID
  distance: number; // in meters
  duration: number; // in seconds
  priority?: number; // Higher number means higher priority
}

export interface NetworkGraph {
  stations: Record<string, Station>;
  lines: Record<string, TransitLine>;
  connections: Connection[];
  walkingShortcuts: WalkingShortcut[];
  interchangePoints: string[]; // Station IDs
  connectivityMatrix: Record<string, Record<string, boolean>>;
}
