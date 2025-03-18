'use client';

import { Suspense } from 'react';
import { Hero } from '@/components/common/Hero';
import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner/JourneyPlanner';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';

export default function SearchResultsPage() {
  return (
    <main>
      <Hero
        badgeText="Route Details"
        title="Your Journey Results"
        subtitle="Discover the best routes for your trip with detailed timings and connections."
        paddingTop="pt-16"
        paddingBottom="pb-28"
      />
      <div className="min-h-screen bg-gray-50 pb-16">
        <Suspense fallback={<SearchParamsFallback />}>
          <JourneyPlanner showResults={true} />
        </Suspense>
      </div>
    </main>
  );
}
