import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';
import { JourneyContainer } from '@/features/journey/components/JourneyContainer';
import { Suspense } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Metadata } from 'next';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Journey Planner | Safar',
  description:
    'Plan your journey on Islamabad, Rawalpindi transit network. Find routes, transfers, and travel times for metro and bus lines.',
  keywords: [
    'journey planner',
    'route finder',
    'transit directions',
    'Islamabad transportation',
    'public transit',
    'Safar',
  ],
};

/**
 * Journey page that allows users to find optimal routes
 * Uses streaming with Suspense for progressive loading
 */
export default function JourneyPage() {
  return (
    <main className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <PageHeader
          title="Journey Planner"
          description="Find the best routes to reach your destination quickly and efficiently"
        />

        {/* Wrap content in container with controlled width */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* 
            Use Suspense with a fallback that matches the final layout dimensions 
            to prevent layout shifts. Set suspense to true on the SearchParamsFallback 
            component to ensure it's loaded ahead of time.
          */}
          <Suspense
            fallback={
              <div className="journey-container-fallback">
                <SearchParamsFallback />
              </div>
            }
          >
            <JourneyContainer />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
