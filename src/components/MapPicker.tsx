import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { findNearestStation } from '@/lib/route-finder';

interface MapPickerProps {
  onLocationsPicked: (from: string, to: string) => void;
}

export const MapPicker = ({ onLocationsPicked }: MapPickerProps) => {
  const [fromMarker, setFromMarker] = useState<google.maps.LatLng | null>(null);
  const [toMarker, setToMarker] = useState<google.maps.LatLng | null>(null);

  const handleMapClick = useCallback(
    (e: google.maps.MouseEvent) => {
      if (!fromMarker) {
        setFromMarker(e.latLng);
      } else if (!toMarker) {
        setToMarker(e.latLng);

        // Find nearest stations and update route
        const fromStation = findNearestStation({
          lat: fromMarker.lat(),
          lng: fromMarker.lng(),
        });
        const toStation = findNearestStation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });

        onLocationsPicked(fromStation, toStation);
      }
    },
    [fromMarker, toMarker, onLocationsPicked]
  );

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        center={{ lat: 33.6844, lng: 73.0479 }} // Islamabad coordinates
        zoom={12}
        onClick={handleMapClick}
        mapContainerClassName="w-full h-[400px] mb-6"
      >
        {fromMarker && <Marker position={fromMarker} label="A" />}
        {toMarker && <Marker position={toMarker} label="B" />}
      </GoogleMap>
    </LoadScript>
  );
};
