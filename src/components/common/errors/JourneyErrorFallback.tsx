'use client';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface JourneyErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function JourneyErrorFallback({
  error,
  resetErrorBoundary,
}: JourneyErrorFallbackProps) {
  // Get error details
  const errorMessage =
    error?.message || 'Something went wrong with the Route planner';

  function handleReset() {
    // Reload the page if no reset function provided
    if (typeof resetErrorBoundary === 'function') {
      resetErrorBoundary();
    } else {
      window.location.href = '/route';
    }
  }

  return (
    <div className="animate-fade-in py-4">
      <Card className="bg-white border border-red-100 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <AlertTriangle className="text-red-500" size={28} />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Route Planner Error
          </h2>

          <p className="text-gray-600 mb-6 max-w-md">{errorMessage}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              onClick={handleReset}
              leftIcon={<RefreshCw size={16} />}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              leftIcon={<Home size={16} />}
              className="border-emerald-500 text-emerald-600"
            >
              Return Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
