import React from 'react';
import { Card } from '@/components/common/Card';
import { MapPin, Star } from 'lucide-react';

// Updated data for popular destinations in Islamabad
const ISLAMABAD_DESTINATIONS = [
  {
    id: 1,
    name: 'Faisal Mosque',
    type: 'Landmark',
  },
  {
    id: 2,
    name: 'Pakistan Monument',
    type: 'Landmark',
  },

  {
    id: 4,
    name: 'Lake View Park',
    type: 'Recreation',
  },
  {
    id: 5,
    name: 'Centaurus Mall',
    type: 'Shopping',
  },
];

export function PopularDestinations() {
  return (
    <Card className="bg-white rounded-xl p-5 h-full">
      <div className="flex items-center mb-4">
        <Star size={18} className="text-amber-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">
          Popular Destinations in Islamabad
        </h2>
      </div>

      <div className="space-y-3">
        {ISLAMABAD_DESTINATIONS.map((destination) => (
          <div
            key={destination.id}
            className="p-3 border border-gray-100 rounded-lg flex items-center"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mr-3">
              <MapPin className="text-emerald-600 w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{destination.name}</p>
              <p className="text-xs text-gray-500">{destination.type}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        These are popular destinations in Islamabad. Use the search form above
        to plan your journey.
      </p>
    </Card>
  );
}
