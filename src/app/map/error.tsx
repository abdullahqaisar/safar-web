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
    <div className="min-h-screen pt-16 md:pt-20 flex items-center justify-center p-4 bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200/50 text-center relative z-10">
        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Something went wrong!
        </h2>
        <p className="text-[color:var(--color-gray-600)] mb-8">
          We had trouble loading the transit network map. Please try again or
          return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-dark)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-gray-300 hover:border-[color:var(--color-accent)]/30 hover:bg-[color:var(--color-accent)]/5 transition-all duration-300 hover:-translate-y-0.5"
          >
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
