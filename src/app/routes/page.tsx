import RoutesPageContainer from '@/features/routes-map/components/RoutesPageContainer';
import { Metadata } from 'next';

// // Use dynamic import to load the RoutesPageContainer component (which is a client component)
// const RoutesPageContainer = dynamic(
//   () => import('@/features/routes-map/RoutesPageContainer'),
//   {
//     loading: () => (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[color:var(--color-bg-cream)]">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-t-[color:var(--color-accent)] border-[color:var(--color-accent)]/30 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading transit network map...</p>
//         </div>
//       </div>
//     ),
//     ssr: false, // Disable SSR for the map component as it uses browser APIs
//   }
// );

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
