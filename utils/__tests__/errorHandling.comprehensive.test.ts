import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CalorieTrackingError,
    DEFAULT_RETRY_CONFIGS,
    ErrorCategory,
    ErrorLogger,
    ErrorSeverity,
    SafeAsyncStorage,
    createCalculationError,
    createErrorFromException,
    createValidationError,
    formatErrorForUser,
    retryOperation,
    withGracefulDegradation
} from '../errorHandling';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Comprehensive Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ErrorLogger.clearErrors();
    // Suppress console logs for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CalorieTrackingError', () => {
    it('should create error with all required properties', () => {
      const error = new CalorieTrackingError({
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        code: 'TEST_ERROR',
        message: 'Test error message',
        userMessage: 'User-friendly message',
        suggestion: 'Try this solution',
        retryable: false,
        context: { test: 'data' }
      });

      expect(error.name).toBe('CalorieTrackingError');
      expect(error.message).toBe('Test error message');
      expect(error.details.category).toBe(ErrorCategory.VALIDATION);
      expect(error.details.severity).toBe(ErrorSeverity.HIGH);
      expect(error.details.code).toBe('TEST_ERROR');
      expect(error.details.userMessage).toBe('User-friendly message');
      expect(error.details.suggestion).toBe('Try this solution');
      expect(error.details.retryable).toBe(false);
      expect(error.details.context).toEqual({ test: 'data' });
      expect(error.details.timestamp).toBeInstanceOf(Date);
    });

    it('should use default values for optional properties', () => {
      const error = new CalorieTrackingError({
        message: 'Test message'
      });

      expect(error.details.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.details.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.details.code).toBe('UNKNOWN_ERROR');
      expect(error.details.userMessage).toBe('An unexpected error occurred');
      expect(error.details.suggestion).toBe('Please try again later');
      expect(error.details.retryable).toBe(true);
    });
  });

  describe('Error Creation Helpers', () => {
    describe('createErrorFromException', () => {
      it('should categorize storage errors correctly', () => {
        const originalError = new Error('AsyncStorage operation failed');
        const calorieError = createErrorFromException(originalError, 'test context');

        expect(calorieError.details.category).toBe(ErrorCategory.STORAGE);
        expect(calorieError.details.code).toBe('STORAGE_ERROR');
        expect(calorieError.details.userMessage).toBe('Unable to access device storage');
        expect(calorieError.details.suggestion).toBe('Please check your device storage and try again');
      });

      it('should categorize validation errors correctly', () => {
        const originalError = new Error('Invalid data provided');
        const calorieError = createErrorFromException(originalError, 'validation');

        expect(calorieError.details.category).toBe(ErrorCategory.VALIDATION);
        expect(calorieError.details.code).toBe('VALIDATION_ERROR');
        expect(calorieError.details.severity).toBe(ErrorSeverity.LOW);
      });

      it('should categorize calculation errors correctly', () => {
        const originalError = new Error('Calculation overflow detected');
        const calorieError = createErrorFromException(originalError, 'calculation');

        expect(calorieError.details.category).toBe(ErrorCategory.CALCULATION);
        expect(calorieError.details.code).toBe('CALCULATION_ERROR');
        expect(calorieError.details.userMessage).toBe('Error during calculation');
      });

      it('should categorize network errors correctly', () => {
        const originalError = new Error('Network timeout occurred');
        const calorieError = createErrorFromException(originalError, 'network');

        expect(calorieError.details.category).toBe(ErrorCategory.NETWORK);
        expect(calorieError.details.code).toBe('NETWORK_ERROR');
        expect(calorieError.details.userMessage).toBe('Network connection issue');
      });

      it('should handle unknown errors', () => {
        const originalError = new Error('Some unknown error');
        const calorieError = createErrorFromException(originalError, 'unknown');

        expect(calorieError.details.category).toBe(ErrorCategory.UNKNOWN);
        expect(calorieError.details.code).toBe('UNKNOWN_ERROR');
      });
    });

    describe('createValidationError', () => {
      it('should create validation error with correct properties', () => {
        const error = createValidationError('age', 25, 'must be between 13 and 120');

        expect(error.details.category).toBe(ErrorCategory.VALIDATION);
        expect(error.details.severity).toBe(ErrorSeverity.LOW);
        expect(error.details.code).toBe('VALIDATION_ERROR');
        expect(error.details.userMessage).toBe('Invalid age');
        expect(error.details.suggestion).toBe('Please ensure age must be between 13 and 120');
        expect(error.details.retryable).toBe(false);
        expect(error.details.context).toEqual({
          field: 'age',
          value: 25,
          requirement: 'must be between 13 and 120'
        });
      });
    });

    describe('createCalculationError', () => {
      it('should create calculation error with correct properties', () => {
        const error = createCalculationError('BMR calculation', 'division by zero', { weight: 0 });

        expect(error.details.category).toBe(ErrorCategory.CALCULATION);
        expect(error.details.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.details.code).toBe('CALCULATION_ERROR');
        expect(error.details.userMessage).toBe('Error during calculation');
        expect(error.details.context).toEqual({
          operation: 'BMR calculation',
          details: 'division by zero',
          weight: 0
        });
      });
    });
  });

  describe('Retry Operation', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const config = DEFAULT_RETRY_CONFIGS.storage;

      const result = await retryOperation(operation, config, 'test operation');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.retryCount).toBe(0);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('storage error'))
        .mockRejectedValueOnce(new Error('storage error'))
        .mockResolvedValueOnce('success');
      
      const config = DEFAULT_RETRY_CONFIGS.storage;

      const result = await retryOperation(operation, config, 'test operation');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.retryCount).toBe(2);
      expect(result.warnings).toContain('test operation succeeded after 2 retries');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('persistent storage error'));
      const config = { ...DEFAULT_RETRY_CONFIGS.storage, maxAttempts: 2 };

      const result = await retryOperation(operation, config, 'test operation');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(CalorieTrackingError);
      expect(result.retryCount).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('validation failed'));
      const config = {
        ...DEFAULT_RETRY_CONFIGS.storage,
        retryableErrors: ['storage', 'network']
      };

      const result = await retryOperation(operation, config, 'test operation');

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('storage error'))
        .mockResolvedValueOnce('success');
      
      const config = {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['storage']
      };

      const startTime = Date.now();
      const result = await retryOperation(operation, config, 'test operation');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100); // At least base delay
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('SafeAsyncStorage', () => {
    describe('getItem', () => {
      it('should successfully get and parse item', async () => {
        const testData = { name: 'test', value: 123 };
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testData));

        const result = await SafeAsyncStorage.getItem('testKey');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(testData);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('testKey');
      });

      it('should return null for non-existent item', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await SafeAsyncStorage.getItem('testKey');

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });

      it('should handle parse errors', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('invalid json');

        const result = await SafeAsyncStorage.getItem('testKey');

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(CalorieTrackingError);
        expect(result.error?.details.code).toBe('PARSE_ERROR');
      });

      it('should retry on storage failures', async () => {
        mockAsyncStorage.getItem
          .mockRejectedValueOnce(new Error('storage error'))
          .mockResolvedValueOnce('{"success": true}');

        const result = await SafeAsyncStorage.getItem('testKey');

        expect(result.success).toBe(true);
        expect(result.retryCount).toBe(1);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(2);
      });
    });

    describe('setItem', () => {
      it('should successfully set item', async () => {
        const testData = { name: 'test', value: 123 };
        mockAsyncStorage.setItem.mockResolvedValue();

        const result = await SafeAsyncStorage.setItem('testKey', testData);

        expect(result.success).toBe(true);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData));
      });

      it('should reject data that is too large', async () => {
        const largeData = { data: 'x'.repeat(20000) };

        const result = await SafeAsyncStorage.setItem('testKey', largeData);

        expect(result.success).toBe(false);
        expect(result.error?.details.code).toBe('DATA_TOO_LARGE');
        expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
      });

      it('should handle storage write errors', async () => {
        mockAsyncStorage.setItem.mockRejectedValue(new Error('storage full'));

        const result = await SafeAsyncStorage.setItem('testKey', { test: 'data' });

        expect(result.success).toBe(false);
        expect(result.error?.details.code).toBe('STORAGE_WRITE_ERROR');
      });

      it('should retry on storage failures', async () => {
        mockAsyncStorage.setItem
          .mockRejectedValueOnce(new Error('storage error'))
          .mockResolvedValueOnce();

        const result = await SafeAsyncStorage.setItem('testKey', { test: 'data' });

        expect(result.success).toBe(true);
        expect(result.retryCount).toBe(1);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2);
      });
    });

    describe('removeItem', () => {
      it('should successfully remove item', async () => {
        mockAsyncStorage.removeItem.mockResolvedValue();

        const result = await SafeAsyncStorage.removeItem('testKey');

        expect(result.success).toBe(true);
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('testKey');
      });

      it('should retry on failures', async () => {
        mockAsyncStorage.removeItem
          .mockRejectedValueOnce(new Error('storage error'))
          .mockResolvedValueOnce();

        const result = await SafeAsyncStorage.removeItem('testKey');

        expect(result.success).toBe(true);
        expect(result.retryCount).toBe(1);
      });
    });
  });

  describe('ErrorLogger', () => {
    it('should log errors and maintain history', () => {
      const error1 = new CalorieTrackingError({
        message: 'Error 1',
        severity: ErrorSeverity.HIGH
      });
      const error2 = new CalorieTrackingError({
        message: 'Error 2',
        severity: ErrorSeverity.LOW
      });

      ErrorLogger.log(error1);
      ErrorLogger.log(error2);

      const recentErrors = ErrorLogger.getRecentErrors(5);
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].message).toBe('Error 2'); // Most recent first
      expect(recentErrors[1].message).toBe('Error 1');
    });

    it('should filter errors by category', () => {
      const validationError = new CalorieTrackingError({
        message: 'Validation error',
        category: ErrorCategory.VALIDATION
      });
      const storageError = new CalorieTrackingError({
        message: 'Storage error',
        category: ErrorCategory.STORAGE
      });

      ErrorLogger.log(validationError);
      ErrorLogger.log(storageError);

      const validationErrors = ErrorLogger.getErrorsByCategory(ErrorCategory.VALIDATION);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Validation error');
    });

    it('should limit error history', () => {
      // Create more errors than the limit
      for (let i = 0; i < 150; i++) {
        const error = new CalorieTrackingError({
          message: `Error ${i}`
        });
        ErrorLogger.log(error);
      }

      const recentErrors = ErrorLogger.getRecentErrors(200);
      expect(recentErrors.length).toBeLessThanOrEqual(100); // Max limit
    });

    it('should export errors as JSON', async () => {
      const error = new CalorieTrackingError({
        message: 'Test error'
      });
      ErrorLogger.log(error);

      const exportedData = await ErrorLogger.exportErrors();
      const parsed = JSON.parse(exportedData);

      expect(parsed.totalErrors).toBe(1);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].message).toBe('Test error');
      expect(parsed.timestamp).toBeTruthy();
    });

    it('should clear errors', () => {
      const error = new CalorieTrackingError({
        message: 'Test error'
      });
      ErrorLogger.log(error);

      expect(ErrorLogger.getRecentErrors()).toHaveLength(1);

      ErrorLogger.clearErrors();

      expect(ErrorLogger.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('withGracefulDegradation', () => {
    it('should return operation result when successful', () => {
      const operation = () => 'success';
      const fallback = 'fallback';

      const result = withGracefulDegradation(operation, fallback, 'test operation');

      expect(result).toBe('success');
    });

    it('should return fallback when operation throws', () => {
      const operation = () => {
        throw new Error('Operation failed');
      };
      const fallback = 'fallback';

      const result = withGracefulDegradation(operation, fallback, 'test operation');

      expect(result).toBe('fallback');
    });

    it('should log errors when operation fails', () => {
      const logSpy = jest.spyOn(ErrorLogger, 'log');
      const operation = () => {
        throw new Error('Operation failed');
      };

      withGracefulDegradation(operation, 'fallback', 'test operation');

      expect(logSpy).toHaveBeenCalledWith(expect.any(CalorieTrackingError));
    });
  });

  describe('formatErrorForUser', () => {
    it('should format validation errors correctly', () => {
      const error = new CalorieTrackingError({
        category: ErrorCategory.VALIDATION,
        message: 'Validation failed',
        userMessage: 'Invalid input',
        suggestion: 'Please check your input',
        retryable: false
      });

      const formatted = formatErrorForUser(error);

      expect(formatted.title).toBe('Input Error');
      expect(formatted.message).toBe('Invalid input');
      expect(formatted.suggestion).toBe('Please check your input');
      expect(formatted.canRetry).toBe(false);
    });

    it('should format storage errors correctly', () => {
      const error = new CalorieTrackingError({
        category: ErrorCategory.STORAGE,
        message: 'Storage failed',
        userMessage: 'Cannot save data',
        suggestion: 'Check storage space',
        retryable: true
      });

      const formatted = formatErrorForUser(error);

      expect(formatted.title).toBe('Storage Error');
      expect(formatted.canRetry).toBe(true);
    });

    it('should format calculation errors correctly', () => {
      const error = new CalorieTrackingError({
        category: ErrorCategory.CALCULATION,
        message: 'Calculation failed',
        userMessage: 'Math error',
        suggestion: 'Check your data'
      });

      const formatted = formatErrorForUser(error);

      expect(formatted.title).toBe('Calculation Error');
    });

    it('should format network errors correctly', () => {
      const error = new CalorieTrackingError({
        category: ErrorCategory.NETWORK,
        message: 'Network failed',
        userMessage: 'Connection lost',
        suggestion: 'Check internet'
      });

      const formatted = formatErrorForUser(error);

      expect(formatted.title).toBe('Connection Error');
    });

    it('should format unknown errors correctly', () => {
      const error = new CalorieTrackingError({
        category: ErrorCategory.UNKNOWN,
        message: 'Unknown error',
        userMessage: 'Something went wrong',
        suggestion: 'Try again'
      });

      const formatted = formatErrorForUser(error);

      expect(formatted.title).toBe('Unexpected Error');
    });
  });
});