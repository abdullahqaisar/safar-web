import { Suspense } from 'react';
import { Hero } from '@/components/common/Hero';
import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';

export default function HomePage() {
  return (
    <main>
      <Hero
        badgeText="Plan Your Trip"
        title="Find The Best Route"
        subtitle="Enter your origin and destination to find the most convenient public transport routes."
        paddingTop="pt-16"
        paddingBottom="pb-28"
      />
      <div className="min-h-screen bg-gray-50 pb-16">
        <Suspense fallback={<SearchParamsFallback />}>
          <JourneyPlanner showResults={false} />
        </Suspense>
      </div>
    </main>
  );
}
