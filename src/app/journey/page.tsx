'use client';

import { Hero } from '@/components/common/Hero';
import { JourneyPlanner } from '@/features/journey/components/JourneyPlanner';

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
        <JourneyPlanner showResults={true} />
      </div>
    </main>
  );
}
