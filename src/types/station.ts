export interface Coordinates {
  lat: number | google.maps.LatLngLiteral;
  lng: number | google.maps.LatLngLiteral;
}

export interface Station {
  id: string;
  name: string;
  coordinates: Coordinates;
}
