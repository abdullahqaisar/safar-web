import RoutesPageContainer from '@/features/routes/components/RoutesPageContainer';
import { Metadata } from 'next';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Transit Network Map | Safar',
  description:
    'Interactive transit network map for Islamabad Metropolitan Area',
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
 */
export default function RoutesPage() {
  return <RoutesPageContainer />;
}
