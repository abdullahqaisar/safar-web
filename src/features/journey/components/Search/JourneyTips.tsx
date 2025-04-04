import React from 'react';
import { Card } from '@/components/common/Card';
import { Info, Clock, Zap, Search, MapPin } from 'lucide-react';

export function JourneyTips() {
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full">
      <div className="flex items-center mb-4">
        <Info size={18} className="text-emerald-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">
          Journey Planning Tips
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex">
          <div className="flex-shrink-0 mt-1">
            <Search className="w-5 h-5 text-emerald-600 mr-3" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Be Specific</h3>
            <p className="text-sm text-gray-600">
              Enter full addresses or specific landmarks for more accurate
              results.
            </p>
          </div>
        </div>

        <div className="flex">
          <div className="flex-shrink-0 mt-1">
            <Clock className="w-5 h-5 text-emerald-600 mr-3" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Plan Ahead</h3>
            <p className="text-sm text-gray-600">
              Check your journey in advance to account for any service changes
              or delays.
            </p>
          </div>
        </div>

        <div className="flex">
          <div className="flex-shrink-0 mt-1">
            <MapPin className="w-5 h-5 text-emerald-600 mr-3" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Use Nearby Stations</h3>
            <p className="text-sm text-gray-600">
              Sometimes walking to a different station can provide faster
              routes.
            </p>
          </div>
        </div>

        <div className="flex">
          <div className="flex-shrink-0 mt-1">
            <Zap className="w-5 h-5 text-emerald-600 mr-3" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Compare Options</h3>
            <p className="text-sm text-gray-600">
              We&apos;ll show you multiple route options so you can choose the
              best one for your needs.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
