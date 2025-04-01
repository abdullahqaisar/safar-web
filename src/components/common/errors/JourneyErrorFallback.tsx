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
      window.location.href = '/';
    }
  }

  return (
    <Card className="mt-8 border border-red-100 bg-white shadow-lg">
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-red-500" size={32} />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Route Planner Error
        </h2>

        <p className="text-gray-600 mb-6 max-w-md">{errorMessage}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={handleReset}
            leftIcon={<RefreshCw size={16} />}
          >
            Try Again
          </Button>

          <Button
            variant="secondary"
            onClick={() => (window.location.href = '/')}
            leftIcon={<Home size={16} />}
          >
            Return Home
          </Button>
        </div>
      </div>
    </Card>
  );
}
