'use client';

import { useLoadScript } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MapSearch from './MapSearch';
import LoadingSkeleton from './LoadingSkeleton';
import { useJourney } from '@/features/journey/context/JourneyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LocationSearchInput() {
  const { setFromLocation, setToLocation, fromLocation, toLocation } =
    useJourney();
  const searchParams = useSearchParams();
  const [pickupValue, setPickupValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  // Load input values from URL on component mount
  useEffect(() => {
    if (searchParams) {
      const fromText = searchParams.get('fromText');
      const toText = searchParams.get('toText');

      if (fromText) {
        setPickupValue(decodeURIComponent(fromText));
      }

      if (toText) {
        setDestinationValue(decodeURIComponent(toText));
      }

      // After initial URL params load, mark first load as complete
      setIsFirstLoad(false);
    }
  }, [searchParams]);

  if (!isLoaded) return <LoadingSkeleton />;

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="relative">
          <MapSearch
            id="from-location"
            onSelectPlace={setFromLocation}
            placeholder="From (e.g., Khanna Pul)"
            value={pickupValue}
            onValueChange={setPickupValue}
            icon="far fa-circle"
          />
          <AnimatePresence>
            {fromLocation && !isFirstLoad && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -right-2 -top-2 h-5 w-5 bg-green-600 rounded-full flex items-center justify-center shadow-sm"
              >
                <i className="fas fa-check text-white text-xs"></i>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative my-2">
          <div className="absolute left-4 h-full flex items-center justify-center z-10">
            <div className="h-full border-l border-dashed border-gray-300 ml-[1px]"></div>
          </div>
        </div>

        <div className="relative">
          <MapSearch
            id="to-location"
            onSelectPlace={setToLocation}
            placeholder="To (e.g., Air University)"
            value={destinationValue}
            onValueChange={setDestinationValue}
            icon="fas fa-map-marker-alt"
          />
          <AnimatePresence>
            {toLocation && !isFirstLoad && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -right-2 -top-2 h-5 w-5 bg-green-600 rounded-full flex items-center justify-center shadow-sm"
              >
                <i className="fas fa-check text-white text-xs"></i>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
