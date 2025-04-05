import { Suspense } from 'react';
import MapPage from '@/features/map/components/page/MapPage';
import { Metadata } from 'next';
import { SearchParamsFallback } from '@/components/common/loaders/SearchParamsFallback';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Transit Network Map | Safar',
  description:
    'Metro routes map for Islamabad, Rawalpindi. Feeder bus routes, Blue line, Red line, Orange Line, Green Line FR 15, FR 14, FR 1, metro lines, and bus stops.',
  keywords: [
    'transit map',
    'bus routes',
    'metro lines',
    'Islamabad transportation',
    'public transit',
    'Safar',
  ],
};

/**
 * Routes page that displays the interactive transit network map
 * Allows users to explore and visualize the transit system
 */
export default function RoutesPage() {
  return (
    <main>
      <Suspense fallback={<SearchParamsFallback />}>
        <MapPage />
      </Suspense>
    </main>
  );
}
