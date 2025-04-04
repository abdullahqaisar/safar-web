import { Suspense } from 'react';
import { JourneyContainer } from '@/features/journey/components/JourneyContainer';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';
import { Metadata } from 'next';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Find Routes | Safar',
  description:
    'Plan your journey with Safar. Find the best routes using public transportation in Islamabad and Rawalpindi. Compare different transit options.',
  keywords: [
    'route finder',
    'journey planner',
    'public transportation',
    'Islamabad routes',
    'Rawalpindi transit',
    'Safar',
  ],
};

/**
 * Journey page that allows users to find optimal routes
 */
export default function JourneyPage() {
  return (
    <main>
      <Suspense fallback={<SearchParamsFallback />}>
        <JourneyContainer />
      </Suspense>
    </main>
  );
}
