/**
 * Comprehensive error handling utilities for the calorie tracking system
 * Provides consistent error handling, retry mechanisms, and user-friendly messages
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  STORAGE = 'STORAGE',
  CALCULATION = 'CALCULATION',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  suggestion: string;
  retryable: boolean;
  timestamp: Date;
  context?: any;
}

export class CalorieTrackingError extends Error {
  public readonly details: ErrorDetails;

  constructor(details: Partial<ErrorDetails> & { message: string }) {
    super(details.message);
    this.name = 'CalorieTrackingError';
    
    this.details = {
      category: details.category || ErrorCategory.UNKNOWN,
      severity: details.severity || ErrorSeverity.MEDIUM,
      code: details.code || 'UNKNOWN_ERROR',
      message: details.message,
      userMessage: details.userMessage || 'An unexpected error occurred',
      suggestion: details.suggestion || 'Please try again later',
      retryable: details.retryable !== false, // Default to true
      timestamp: new Date(),
      context: details.context
    };
  }
}

/**
 * Retry configuration for different types of operations
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  storage: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryableErrors: ['storage', 'timeout', 'network']
  },
  calculation: {
    maxAttempts: 2,
    baseDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['calculation', 'overflow', 'timeout']
  },
  validation: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    retryableErrors: []
  }
};

/**
 * Result wrapper for operations that can fail
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: CalorieTrackingError;
  retryCount?: number;
  warnings?: string[];
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName: string = 'operation'
): Promise<OperationResult<T>> {
  let lastError: Error | null = null;
  const warnings: string[] = [];

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        warnings.push(`${operationName} succeeded after ${attempt - 1} retries`);
      }

      return {
        success: true,
        data: result,
        retryCount: attempt - 1,
        warnings
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if error is retryable
      const isRetryable = config.retryableErrors?.some(retryableError =>
        lastError!.message.toLowerCase().includes(retryableError.toLowerCase())
      ) ?? true;

      // If not retryable or last attempt, break
      if (!isRetryable || attempt === config.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      warnings.push(`${operationName} failed (attempt ${attempt}), retrying in ${delay}ms`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  const calorieError = lastError instanceof CalorieTrackingError 
    ? lastError 
    : createErrorFromException(lastError!, operationName);

  return {
    success: false,
    error: calorieError,
    retryCount: config.maxAttempts,
    warnings
  };
}

/**
 * Create a CalorieTrackingError from a generic Error
 */
export function createErrorFromException(
  error: Error,
  context: string = 'unknown'
): CalorieTrackingError {
  const message = error.message.toLowerCase();
  
  // Categorize error based on message content
  let category = ErrorCategory.UNKNOWN;
  let severity = ErrorSeverity.MEDIUM;
  let userMessage = 'An unexpected error occurred';
  let suggestion = 'Please try again later';
  let code = 'UNKNOWN_ERROR';

  if (message.includes('storage') || message.includes('asyncstorage')) {
    category = ErrorCategory.STORAGE;
    code = 'STORAGE_ERROR';
    userMessage = 'Unable to access device storage';
    suggestion = 'Please check your device storage and try again';
  } else if (message.includes('validation') || message.includes('invalid')) {
    category = ErrorCategory.VALIDATION;
    code = 'VALIDATION_ERROR';
    userMessage = 'Invalid data provided';
    suggestion = 'Please check your input and try again';
    severity = ErrorSeverity.LOW;
  } else if (message.includes('calculation') || message.includes('overflow') || message.includes('math')) {
    category = ErrorCategory.CALCULATION;
    code = 'CALCULATION_ERROR';
    userMessage = 'Error during calculation';
    suggestion = 'Please verify your data and try again';
  } else if (message.includes('network') || message.includes('timeout')) {
    category = ErrorCategory.NETWORK;
    code = 'NETWORK_ERROR';
    userMessage = 'Network connection issue';
    suggestion = 'Please check your internet connection and try again';
  }

  return new CalorieTrackingError({
    category,
    severity,
    code,
    message: error.message,
    userMessage,
    suggestion,
    context: { originalError: error.name, context }
  });
}

/**
 * Safe AsyncStorage operations with retry logic
 */
export class SafeAsyncStorage {
  static async getItem<T>(key: string): Promise<OperationResult<T | null>> {
    return retryOperation(
      async () => {
        const value = await AsyncStorage.getItem(key);
        if (value === null) return null;
        
        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          throw new CalorieTrackingError({
            category: ErrorCategory.STORAGE,
            severity: ErrorSeverity.MEDIUM,
            code: 'PARSE_ERROR',
            message: `Failed to parse stored data for key: ${key}`,
            userMessage: 'Stored data is corrupted',
            suggestion: 'The app will reset this data. Please re-enter your information.',
            context: { key, parseError }
          });
        }
      },
      DEFAULT_RETRY_CONFIGS.storage,
      `getItem(${key})`
    );
  }

  static async setItem<T>(key: string, value: T): Promise<OperationResult<void>> {
    return retryOperation(
      async () => {
        try {
          const serialized = JSON.stringify(value);
          
          // Check size limit (10KB)
          if (serialized.length > 10240) {
            throw new CalorieTrackingError({
              category: ErrorCategory.STORAGE,
              severity: ErrorSeverity.HIGH,
              code: 'DATA_TOO_LARGE',
              message: `Data too large for key: ${key}`,
              userMessage: 'Data is too large to save',
              suggestion: 'Please reduce the amount of data or contact support',
              retryable: false,
              context: { key, size: serialized.length }
            });
          }
          
          await AsyncStorage.setItem(key, serialized);
        } catch (error) {
          if (error instanceof CalorieTrackingError) {
            throw error;
          }
          
          throw new CalorieTrackingError({
            category: ErrorCategory.STORAGE,
            severity: ErrorSeverity.HIGH,
            code: 'STORAGE_WRITE_ERROR',
            message: `Failed to save data for key: ${key}`,
            userMessage: 'Unable to save data',
            suggestion: 'Please check your device storage and try again',
            context: { key, originalError: error }
          });
        }
      },
      DEFAULT_RETRY_CONFIGS.storage,
      `setItem(${key})`
    );
  }

  static async removeItem(key: string): Promise<OperationResult<void>> {
    return retryOperation(
      async () => {
        await AsyncStorage.removeItem(key);
      },
      DEFAULT_RETRY_CONFIGS.storage,
      `removeItem(${key})`
    );
  }
}

/**
 * Validation error helper
 */
export function createValidationError(
  field: string,
  value: any,
  requirement: string
): CalorieTrackingError {
  return new CalorieTrackingError({
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    code: 'VALIDATION_ERROR',
    message: `Validation failed for ${field}: ${requirement}`,
    userMessage: `Invalid ${field}`,
    suggestion: `Please ensure ${field} ${requirement}`,
    retryable: false,
    context: { field, value, requirement }
  });
}

/**
 * Calculation error helper
 */
export function createCalculationError(
  operation: string,
  details: string,
  context?: any
): CalorieTrackingError {
  return new CalorieTrackingError({
    category: ErrorCategory.CALCULATION,
    severity: ErrorSeverity.MEDIUM,
    code: 'CALCULATION_ERROR',
    message: `Calculation error in ${operation}: ${details}`,
    userMessage: 'Error during calculation',
    suggestion: 'Please verify your data and try again',
    context: { operation, details, ...context }
  });
}

/**
 * Error logging utility
 */
export class ErrorLogger {
  private static errors: ErrorDetails[] = [];
  private static maxErrors = 100;

  static log(error: CalorieTrackingError): void {
    // Add to in-memory log
    this.errors.unshift(error.details);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console based on severity
    switch (error.details.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('CRITICAL ERROR:', error.details);
        break;
      case ErrorSeverity.HIGH:
        console.error('HIGH SEVERITY ERROR:', error.details);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('MEDIUM SEVERITY ERROR:', error.details);
        break;
      case ErrorSeverity.LOW:
        console.info('LOW SEVERITY ERROR:', error.details);
        break;
    }
  }

  static getRecentErrors(count: number = 10): ErrorDetails[] {
    return this.errors.slice(0, count);
  }

  static getErrorsByCategory(category: ErrorCategory): ErrorDetails[] {
    return this.errors.filter(error => error.category === category);
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static async exportErrors(): Promise<string> {
    const errorReport = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      errors: this.errors
    };
    
    return JSON.stringify(errorReport, null, 2);
  }
}

/**
 * Graceful degradation helper
 */
export function withGracefulDegradation<T>(
  operation: () => T,
  fallback: T,
  errorContext: string = 'operation'
): T {
  try {
    return operation();
  } catch (error) {
    const calorieError = error instanceof CalorieTrackingError 
      ? error 
      : createErrorFromException(error instanceof Error ? error : new Error('Unknown error'), errorContext);
    
    ErrorLogger.log(calorieError);
    
    console.warn(`Graceful degradation applied for ${errorContext}:`, calorieError.details);
    return fallback;
  }
}

/**
 * User-friendly error message formatter
 */
export function formatErrorForUser(error: CalorieTrackingError): {
  title: string;
  message: string;
  suggestion: string;
  canRetry: boolean;
} {
  const { category, userMessage, suggestion, retryable } = error.details;
  
  let title = 'Error';
  
  switch (category) {
    case ErrorCategory.VALIDATION:
      title = 'Input Error';
      break;
    case ErrorCategory.STORAGE:
      title = 'Storage Error';
      break;
    case ErrorCategory.CALCULATION:
      title = 'Calculation Error';
      break;
    case ErrorCategory.NETWORK:
      title = 'Connection Error';
      break;
    default:
      title = 'Unexpected Error';
  }

  return {
    title,
    message: userMessage,
    suggestion,
    canRetry: retryable
  };
}