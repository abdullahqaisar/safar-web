import { useState, useCallback } from 'react';
import { AppError, ErrorCodes } from '../errors/AppError';
import { handleError, ErrorContext } from '../errors/errorHandler';

interface UseErrorHandlerOptions {
  logErrors?: boolean;
  showToasts?: boolean;
}

/**
 * Custom hook for handling errors consistently across the application
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [error, setError] = useState<AppError | null>(null);
  const [isError, setIsError] = useState(false);

  const { logErrors = true, showToasts = true } = options;

  const handleException = useCallback(
    (caught: unknown, context: ErrorContext = {}) => {
      // Set defaults for error context
      const errorContext: ErrorContext = {
        showToast: showToasts,
        ...context,
      };

      // Process the error using the central error handler
      const appError = handleError(caught, errorContext);

      // Update local error state
      setError(appError);
      setIsError(true);

      // Return the normalized error for additional handling if needed
      return appError;
    },
    [showToasts]
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const createError = useCallback(
    (
      code: keyof typeof ErrorCodes,
      message?: string,
      metadata: Record<string, any> = {}
    ) => {
      return new AppError(
        message || getDefaultErrorMessage(code),
        ErrorCodes[code],
        metadata
      );
    },
    []
  );

  return {
    error,
    isError,
    handleError: handleException,
    clearError,
    createError,

    // Check error types
    isNetworkError: error?.code === ErrorCodes.NETWORK_ERROR,
    isServerError: error?.code === ErrorCodes.SERVER_ERROR,
    isValidationError: error?.code === ErrorCodes.VALIDATION_ERROR,
  };
}

// Helper function to get default error messages
function getDefaultErrorMessage(code: keyof typeof ErrorCodes): string {
  const messages: Record<keyof typeof ErrorCodes, string> = {
    UNKNOWN_ERROR: 'An unexpected error occurred',
    NETWORK_ERROR:
      'Network error. Please check your internet connection and try again.',
    SERVER_ERROR: 'The server encountered an error. Please try again later.',
    NO_START_STATION: 'No transit stations found near your starting location.',
    NO_END_STATION: 'No transit stations found near your destination.',
    NO_ROUTES_FOUND: 'No routes found between these locations.',
    INVALID_LOCATION: 'The location provided is invalid or cannot be found.',
    UNAUTHORIZED: 'You must be logged in to access this resource.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    VALIDATION_ERROR: 'There was a problem with the data you provided.',
    MISSING_REQUIRED_FIELDS: 'Please fill in all required fields.',
  };

  return messages[code] || messages.UNKNOWN_ERROR;
}
