import { useMapEvents } from 'react-leaflet';

interface ZoomListenerProps {
  onZoomChange: (zoom: number) => void;
}

const ZoomListener = ({ onZoomChange }: ZoomListenerProps) => {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });

  return null;
};

export default ZoomListener;
