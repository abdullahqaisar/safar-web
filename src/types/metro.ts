import { MetroLine, Station } from '@/lib/metro-data';

export interface LocationSelectProps {
  pickup: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
}

export interface RouteSegmentProps {
  segment: {
    line: MetroLine;
    stations: Station[];
  };
  isLast: boolean;
}
