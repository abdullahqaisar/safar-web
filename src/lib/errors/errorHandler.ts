import { AppError, ErrorCodes } from './AppError';
import { showError, showWarning, ToastOptions } from '../utils/toast';

/**
 * Interface for error metadata to help with handling specific error scenarios
 */
export interface ErrorContext {
  // UI related information
  title?: string;
  userMessage?: string;
  severity?: 'error' | 'warning' | 'info';
  showToast?: boolean;
  toastOptions?: ToastOptions;

  // Error categorization for UI treatment
  isStartLocationError?: boolean;
  isEndLocationError?: boolean;
  isRouteError?: boolean;
  isNetworkError?: boolean;
  isServerError?: boolean;

  // Additional data
  [key: string]: any;
}

/**
 * Handles any error by logging and displaying appropriate UI messages
 */
export function handleError(
  error: unknown,
  context: ErrorContext = {}
): AppError {
  const appError = normalizeError(error);

  // Enhance with error context metadata
  appError.metadata = {
    ...appError.metadata,
    ...context,
  };

  // Log error (can be replaced with a proper logging service)
  console.error('[AppError]', appError);

  // Show toast notification if specified (defaults to true)
  if (context.showToast !== false) {
    const message = context.userMessage || appError.message;

    if (context.severity === 'warning') {
      showWarning(message, context.toastOptions);
    } else {
      showError(message, context.toastOptions);
    }
  }

  return appError;
}

/**
 * Normalizes any error type into an AppError
 */
export function normalizeError(error: unknown): AppError {
  // Already our AppError type
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    // Network errors
    if (
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed')
    ) {
      return new AppError(
        'Network error. Please check your internet connection and try again.',
        ErrorCodes.NETWORK_ERROR
      );
    }

    // Return a wrapped standard error
    return new AppError(error.message, ErrorCodes.UNKNOWN_ERROR, {
      originalError: error.name,
    });
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError(error, ErrorCodes.UNKNOWN_ERROR);
  }

  // Handle unexpected error types
  return new AppError(
    'An unexpected error occurred',
    ErrorCodes.UNKNOWN_ERROR,
    { originalError: error }
  );
}

/**
 * Creates an error for the specified error code with appropriate default message
 */
export function createError(
  code: keyof typeof ErrorCodes,
  message?: string
): AppError {
  const defaultMessages: Record<keyof typeof ErrorCodes, string> = {
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

  return new AppError(message || defaultMessages[code], ErrorCodes[code]);
}
