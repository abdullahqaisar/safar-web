import { Coordinates } from './graph';

export interface NearbyStationInfo {
  id: string;
  name: string;
  distance: number;
  coordinates: Coordinates;
}
