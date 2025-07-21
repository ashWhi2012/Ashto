import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { CalorieCalculationErrorBoundary } from '../CalorieCalculationErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text>No error</Text>;
};

// Mock component that throws specific error types
const ThrowSpecificError = ({ errorType }: { errorType: string }) => {
  const errorMessages = {
    profile: 'Invalid profile weight data',
    workout: 'Workout exercise data missing',
    storage: 'AsyncStorage operation failed',
    calculation: 'Calculation overflow detected',
    general: 'General error occurred'
  };
  
  throw new Error(errorMessages[errorType as keyof typeof errorMessages] || 'Unknown error');
};

describe('CalorieCalculationErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowError shouldThrow={false} />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('No error')).toBeTruthy();
    });

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn();
      
      render(
        <CalorieCalculationErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Error Display', () => {
    it('should display default error message when error occurs', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Calorie Calculation Error')).toBeTruthy();
      expect(getByText(/An unexpected error occurred during calorie calculation/)).toBeTruthy();
      expect(getByText(/Please try again or check your profile settings/)).toBeTruthy();
    });

    it('should display profile-specific error message for profile errors', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowSpecificError errorType="profile" />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Profile Data Issue')).toBeTruthy();
      expect(getByText(/There seems to be an issue with your profile information/)).toBeTruthy();
      expect(getByText(/Please check your profile settings and ensure all required fields are filled correctly/)).toBeTruthy();
    });

    it('should display workout-specific error message for workout errors', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowSpecificError errorType="workout" />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Workout Data Issue')).toBeTruthy();
      expect(getByText(/There was a problem processing your workout data/)).toBeTruthy();
      expect(getByText(/Your workout has been saved. You can try calculating calories again later/)).toBeTruthy();
    });

    it('should display storage-specific error message for storage errors', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowSpecificError errorType="storage" />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Storage Error')).toBeTruthy();
      expect(getByText(/Unable to access stored data for calorie calculation/)).toBeTruthy();
      expect(getByText(/Please check your device storage and try again/)).toBeTruthy();
    });

    it('should display calculation-specific error message for calculation errors', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowSpecificError errorType="calculation" />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Calculation Error')).toBeTruthy();
      expect(getByText(/The calorie calculation encountered a mathematical error/)).toBeTruthy();
      expect(getByText(/This might be due to extreme values. Please verify your workout and profile data/)).toBeTruthy();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button initially', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should reset error state when retry button is pressed', async () => {
      let shouldThrow = true;
      
      const TestComponent = () => (
        <CalorieCalculationErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </CalorieCalculationErrorBoundary>
      );

      const { getByText, rerender } = render(<TestComponent />);

      // Error should be displayed
      expect(getByText('Try Again')).toBeTruthy();

      // Change the error condition
      shouldThrow = false;

      // Press retry button
      fireEvent.press(getByText('Try Again'));

      // Wait for retry delay and rerender
      await waitFor(() => {
        rerender(<TestComponent />);
        expect(getByText('No error')).toBeTruthy();
      });
    });

    it('should show retry count after first retry', async () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary maxRetries={3}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      // First retry
      fireEvent.press(getByText('Try Again'));

      await waitFor(() => {
        expect(getByText('Attempt 1 of 3')).toBeTruthy();
      });
    });

    it('should show "Retrying..." when retry is in progress', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary retryDelay={5000}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      fireEvent.press(getByText('Try Again'));

      expect(getByText('Retrying...')).toBeTruthy();
    });

    it('should disable retry button when retrying', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary retryDelay={5000}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);

      // Button should be disabled (we can't directly test disabled state in RN, but text changes)
      expect(getByText('Retrying...')).toBeTruthy();
    });

    it('should show max retries message when retry limit reached', async () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary maxRetries={2} retryDelay={100}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      // First retry
      fireEvent.press(getByText('Try Again'));
      
      await waitFor(() => {
        expect(getByText('Try Again')).toBeTruthy();
      });

      // Second retry (should reach max)
      fireEvent.press(getByText('Try Again'));

      await waitFor(() => {
        expect(getByText(/Maximum retry attempts reached/)).toBeTruthy();
        expect(getByText(/Please restart the app or contact support/)).toBeTruthy();
      });
    });

    it('should not show retry button when max retries reached', async () => {
      const { getByText, queryByText } = render(
        <CalorieCalculationErrorBoundary maxRetries={1} retryDelay={100}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      // First retry (should reach max)
      fireEvent.press(getByText('Try Again'));

      await waitFor(() => {
        expect(queryByText('Try Again')).toBeNull();
        expect(getByText(/Maximum retry attempts reached/)).toBeTruthy();
      });
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (
        <View>
          <Text>Custom Error UI</Text>
        </View>
      );

      const { getByText } = render(
        <CalorieCalculationErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      expect(getByText('Custom Error UI')).toBeTruthy();
    });
  });

  describe('Configuration', () => {
    it('should respect custom maxRetries prop', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary maxRetries={5}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      fireEvent.press(getByText('Try Again'));

      expect(getByText('Attempt 1 of 5')).toBeTruthy();
    });

    it('should use default maxRetries when not specified', () => {
      const { getByText } = render(
        <CalorieCalculationErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      fireEvent.press(getByText('Try Again'));

      expect(getByText('Attempt 1 of 3')).toBeTruthy();
    });
  });

  describe('Error Logging', () => {
    it('should log error details to console', () => {
      const consoleSpy = jest.spyOn(console, 'error');

      render(
        <CalorieCalculationErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'CalorieCalculationErrorBoundary caught an error:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error info:',
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should warn when max retries reached', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      const { getByText } = render(
        <CalorieCalculationErrorBoundary maxRetries={1} retryDelay={100}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      fireEvent.press(getByText('Try Again'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Maximum retry attempts reached for CalorieCalculationErrorBoundary'
        );
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <CalorieCalculationErrorBoundary retryDelay={5000}>
          <ThrowError shouldThrow={true} />
        </CalorieCalculationErrorBoundary>
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});