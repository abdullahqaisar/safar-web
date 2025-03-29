import { useMapEvents } from 'react-leaflet';

interface ZoomListenerProps {
  onZoomChange: (zoom: number) => void;
}

const ZoomListener = ({ onZoomChange }: ZoomListenerProps) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
};

export default ZoomListener;
