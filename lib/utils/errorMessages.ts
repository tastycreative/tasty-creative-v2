/**
 * User-Friendly Error Messages
 * Converts technical error messages into user-friendly, actionable messages
 */

export interface ErrorContext {
  operation?: string;
  resource?: string;
  retryable?: boolean;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  retryable: boolean;
}

/**
 * Map of common error patterns to user-friendly messages
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  handler: (error: Error, context?: ErrorContext) => UserFriendlyError;
}> = [
  // Network errors
  {
    pattern: /fetch failed|network error|failed to fetch/i,
    handler: (error, context) => ({
      title: 'Connection Error',
      message: `We couldn't ${context?.operation || 'complete your request'}. Please check your internet connection and try again.`,
      action: 'Check your connection and retry',
      retryable: true,
    }),
  },

  // Authentication errors
  {
    pattern: /unauthorized|not authenticated|401/i,
    handler: () => ({
      title: 'Authentication Required',
      message: 'Your session has expired. Please sign in again to continue.',
      action: 'Please sign in again',
      retryable: false,
    }),
  },

  // Permission errors
  {
    pattern: /forbidden|not allowed|permission denied|403/i,
    handler: (error, context) => ({
      title: 'Permission Denied',
      message: `You don't have permission to ${context?.operation || 'perform this action'}.`,
      action: 'Contact your team admin for access',
      retryable: false,
    }),
  },

  // Not found errors
  {
    pattern: /not found|404|does not exist/i,
    handler: (error, context) => ({
      title: 'Not Found',
      message: `The ${context?.resource || 'item'} you're looking for doesn't exist or has been deleted.`,
      action: 'Try refreshing the page',
      retryable: false,
    }),
  },

  // Validation errors
  {
    pattern: /validation|invalid|required|400/i,
    handler: (error, context) => ({
      title: 'Invalid Input',
      message: error.message || `Please check your input and make sure all required fields are filled correctly.`,
      action: 'Review and correct your input',
      retryable: false,
    }),
  },

  // Conflict errors
  {
    pattern: /conflict|already exists|409/i,
    handler: (error, context) => ({
      title: 'Conflict',
      message: `The ${context?.resource || 'item'} already exists or has been modified by someone else.`,
      action: 'Refresh and try again',
      retryable: true,
    }),
  },

  // Rate limit errors
  {
    pattern: /rate limit|too many requests|429/i,
    handler: () => ({
      title: 'Too Many Requests',
      message: 'You\'re sending requests too quickly. Please slow down and try again in a moment.',
      action: 'Wait a moment and try again',
      retryable: true,
    }),
  },

  // Server errors
  {
    pattern: /server error|internal error|500|502|503|504/i,
    handler: (error, context) => ({
      title: 'Server Error',
      message: `We're experiencing technical difficulties ${context?.operation ? `while trying to ${context.operation}` : ''}. Please try again in a moment.`,
      action: 'Try again in a moment',
      retryable: true,
    }),
  },

  // Timeout errors
  {
    pattern: /timeout|timed out/i,
    handler: (error, context) => ({
      title: 'Request Timeout',
      message: `The request took too long to complete. This might be due to a slow connection or heavy server load.`,
      action: 'Try again with a better connection',
      retryable: true,
    }),
  },

  // Database errors
  {
    pattern: /database|prisma|unique constraint/i,
    handler: (error, context) => ({
      title: 'Data Error',
      message: `We couldn't save your changes. This might be due to conflicting data or a temporary issue.`,
      action: 'Refresh and try again',
      retryable: true,
    }),
  },
];

/**
 * Convert a technical error into a user-friendly error message
 */
export function getUserFriendlyError(
  error: Error | string,
  context?: ErrorContext
): UserFriendlyError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorObject = typeof error === 'string' ? new Error(error) : error;

  // Try to match against known error patterns
  for (const { pattern, handler } of ERROR_PATTERNS) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    if (regex.test(errorMessage)) {
      return handler(errorObject, context);
    }
  }

  // Default generic error
  return {
    title: 'Something Went Wrong',
    message: context?.operation
      ? `We couldn't ${context.operation}. Please try again.`
      : 'An unexpected error occurred. Please try again.',
    action: 'Try again',
    retryable: true,
  };
}

/**
 * Get a user-friendly error message for task operations
 */
export function getTaskErrorMessage(error: Error | string, operation: string): UserFriendlyError {
  return getUserFriendlyError(error, {
    operation,
    resource: 'task',
    retryable: true,
  });
}

/**
 * Get a user-friendly error message for column operations
 */
export function getColumnErrorMessage(error: Error | string, operation: string): UserFriendlyError {
  return getUserFriendlyError(error, {
    operation,
    resource: 'column',
    retryable: true,
  });
}

/**
 * Get a user-friendly error message for comment operations
 */
export function getCommentErrorMessage(error: Error | string, operation: string): UserFriendlyError {
  return getUserFriendlyError(error, {
    operation,
    resource: 'comment',
    retryable: true,
  });
}

/**
 * Retry a failed operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Check if error is retryable
      const friendlyError = getUserFriendlyError(lastError);
      if (!friendlyError.retryable) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Format an error for logging
 */
export function formatErrorForLogging(error: Error | string, context?: ErrorContext): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  let log = `Error: ${errorMessage}`;

  if (context?.operation) {
    log += `\nOperation: ${context.operation}`;
  }

  if (context?.resource) {
    log += `\nResource: ${context.resource}`;
  }

  if (stack) {
    log += `\n\nStack trace:\n${stack}`;
  }

  return log;
}
