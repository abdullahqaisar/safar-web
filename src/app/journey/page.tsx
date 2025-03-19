'use client';

import { Suspense } from 'react';
import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner/JourneyPlanner';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';

export default function SearchResultsPage() {
  return (
    <main>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#FEF6EC] pb-16 pt-10">
        <div className="container mx-auto px-4 sm:px-6">
          <Suspense fallback={<SearchParamsFallback />}>
            <JourneyPlanner showResults={true} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
