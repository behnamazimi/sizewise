/**
 * Base error class for SizeWise errors
 */
export class SizeWiseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SizeWiseError';
  }
}

/**
 * Configuration related errors
 */
export class ConfigError extends SizeWiseError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends SizeWiseError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

/**
 * Platform/Provider related errors
 */
export class PlatformError extends SizeWiseError {
  constructor(message: string) {
    super(message, 'PLATFORM_ERROR');
    this.name = 'PlatformError';
  }
}

/**
 * API related errors
 */
export class APIError extends SizeWiseError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends SizeWiseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error handler function that processes errors and returns appropriate error messages
 */
export function handleError(error: unknown): { message: string; code: string } {
  if (error instanceof SizeWiseError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : String(error);
  return {
    message,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Utility to ensure an error is a SizeWiseError
 */
export function ensureSizeWiseError(error: unknown): SizeWiseError {
  if (error instanceof SizeWiseError) {
    return error;
  }
  return new SizeWiseError(
    error instanceof Error ? error.message : String(error),
    'UNKNOWN_ERROR'
  );
} 