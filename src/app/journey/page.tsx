'use client';

import { Suspense } from 'react';
import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner/JourneyPlanner';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';

export default function SearchResultsPage() {
  return (
    <main>
      <div className="min-h-screen bg-gray-50 pb-16">
        <Suspense fallback={<SearchParamsFallback />}>
          <JourneyPlanner showResults={true} />
        </Suspense>
      </div>
    </main>
  );
}
