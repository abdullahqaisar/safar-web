import { Button } from '@/components/common/Button';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { ReactNode } from 'react';

interface ErrorDisplayProps {
  error: AppError | Error | null;
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
  onReset?: () => void;
}

export function ErrorDisplay({
  error,
  title,
  description,
  action,
  onRetry,
  onReset,
}: ErrorDisplayProps) {
  if (!error) return null;

  // Extract error code if it's an AppError
  const errorCode = (error as AppError).code || ErrorCodes.UNKNOWN_ERROR;
  const errorMessage = error.message || 'An unexpected error occurred';

  // Determine icon and title based on error type
  const getErrorIcon = () => {
    switch (errorCode) {
      case ErrorCodes.NO_START_STATION:
        return (
          <i className="fas fa-map-marker-alt text-orange-500 text-xl"></i>
        );
      case ErrorCodes.NO_END_STATION:
        return <i className="fas fa-map-pin text-orange-500 text-xl"></i>;
      case ErrorCodes.NO_ROUTES_FOUND:
        return <i className="fas fa-route text-amber-500 text-xl"></i>;
      case ErrorCodes.NETWORK_ERROR:
        return <i className="fas fa-wifi text-red-500 text-xl"></i>;
      default:
        return (
          <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
        );
    }
  };

  const getErrorTitle = () => {
    if (title) return title;

    switch (errorCode) {
      case ErrorCodes.NO_START_STATION:
        return 'No Transit Near Starting Point';
      case ErrorCodes.NO_END_STATION:
        return 'No Transit Near Destination';
      case ErrorCodes.NO_ROUTES_FOUND:
        return 'No Routes Available';
      case ErrorCodes.NETWORK_ERROR:
        return 'Connection Problem';
      case ErrorCodes.SERVER_ERROR:
        return 'Service Temporarily Unavailable';
      default:
        return 'Error';
    }
  };

  const getBackgroundColor = () => {
    switch (errorCode) {
      case ErrorCodes.NO_START_STATION:
      case ErrorCodes.NO_END_STATION:
        return 'bg-orange-50';
      case ErrorCodes.NO_ROUTES_FOUND:
        return 'bg-amber-50';
      case ErrorCodes.NETWORK_ERROR:
      case ErrorCodes.SERVER_ERROR:
        return 'bg-red-50';
      default:
        return 'bg-red-50';
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
      <div className="flex flex-col items-center">
        <div
          className={`w-16 h-16 ${getBackgroundColor()} rounded-full flex items-center justify-center mb-4`}
        >
          {getErrorIcon()}
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {getErrorTitle()}
        </h3>

        <p className="text-gray-600 mb-4 max-w-md">
          {description || errorMessage}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {action}

          {onRetry && (
            <Button variant="primary" onClick={onRetry} size="sm">
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </Button>
          )}

          {onReset && (
            <Button variant="secondary" onClick={onReset} size="sm">
              <i className="fas fa-arrow-left mr-2"></i>
              Go Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
