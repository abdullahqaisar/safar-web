'use client'; // Error components must be Client Components

import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Custom error component for the routes section
 */
export default function RoutesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Routes page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-[color:var(--color-bg-cream)] dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Something went wrong!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We had trouble loading the transit network map. Please try again or
          return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Return home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
