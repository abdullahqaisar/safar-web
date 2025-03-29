import React from 'react';

interface MapTypeControlsProps {
  mapType: 'streets' | 'satellite';
  setMapType: (type: 'streets' | 'satellite') => void;
}

const MapTypeControls: React.FC<MapTypeControlsProps> = ({
  mapType,
  setMapType,
}) => {
  return (
    <div className="absolute top-3 right-3 z-[999]">
      <div className="bg-white rounded-md shadow-md p-2 flex gap-2">
        <button
          onClick={() => setMapType('streets')}
          className={`px-2 py-1 text-xs font-medium rounded ${
            mapType === 'streets'
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-100'
          }`}
        >
          Streets
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-2 py-1 text-xs font-medium rounded ${
            mapType === 'satellite'
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-100'
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
};

export default MapTypeControls;
