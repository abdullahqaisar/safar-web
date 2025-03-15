/**
 * Base error class for application errors.
 * Provides standard structure for all app errors.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata: Record<string, any> = {}
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace in modern JS engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to a plain object for logging or serializing
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
    };
  }
}

/**
 * Create a type-safe error code registry to ensure consistency
 */
export const ErrorCodes = {
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // Location/routing errors
  NO_START_STATION: 'NO_START_STATION',
  NO_END_STATION: 'NO_END_STATION',
  NO_ROUTES_FOUND: 'NO_ROUTES_FOUND',
  INVALID_LOCATION: 'INVALID_LOCATION',

  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Form errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
