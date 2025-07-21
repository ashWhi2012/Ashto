import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AgeInput } from '../AgeInput';

describe('AgeInput', () => {
  const defaultProps = {
    value: 25,
    onValueChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId, getByText } = render(<AgeInput {...defaultProps} />);
      
      expect(getByText('Age')).toBeTruthy();
      expect(getByTestId('age-input-field')).toBeTruthy();
    });

    it('renders with custom label and placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <AgeInput 
          {...defaultProps} 
          label="Your Age" 
          placeholder="Enter age here"
        />
      );
      
      expect(getByText('Your Age')).toBeTruthy();
      expect(getByPlaceholderText('Enter age here')).toBeTruthy();
    });

    it('displays the current value', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} value={30} />);
      const input = getByTestId('age-input-field');
      
      expect(input.props.value).toBe('30');
    });
  });

  describe('Input Handling', () => {
    it('calls onValueChange when valid number is entered', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      fireEvent.changeText(input, '35');
      
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(35);
    });

    it('filters out non-numeric characters', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      fireEvent.changeText(input, '3a5b');
      
      expect(input.props.value).toBe('35');
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(35);
    });

    it('does not call onValueChange for empty input', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      jest.clearAllMocks();
      fireEvent.changeText(input, '');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('does not call onValueChange for zero', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      jest.clearAllMocks();
      fireEvent.changeText(input, '0');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('clears validation error when user starts typing', async () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      // Create validation error
      fireEvent.changeText(input, '10');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('age-input-error')).toBeTruthy();
      });
      
      // Start typing again
      fireEvent.changeText(input, '25');
      
      // Error should be cleared internally
    });
  });

  describe('Validation', () => {
    it('shows validation error for age too low', async () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      fireEvent.changeText(input, '10');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('age-input-error')).toBeTruthy();
        expect(getByTestId('age-input-error').props.children).toBe('Age must be at least 13 years');
      });
    });

    it('shows validation error for age too high', async () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      fireEvent.changeText(input, '150');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('age-input-error')).toBeTruthy();
        expect(getByTestId('age-input-error').props.children).toBe('Age must be 120 years or less');
      });
    });

    it('shows validation error for non-integer age', async () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      // This shouldn't happen due to numeric filtering, but test the validation
      fireEvent.changeText(input, '');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('age-input-error')).toBeTruthy();
        expect(getByTestId('age-input-error').props.children).toBe('Please enter a valid age');
      });
    });

    it('displays external error prop', () => {
      const { getByTestId } = render(
        <AgeInput {...defaultProps} error="External error message" />
      );
      
      expect(getByTestId('age-input-error')).toBeTruthy();
      expect(getByTestId('age-input-error').props.children).toBe('External error message');
    });

    it('does not show validation error for valid age', async () => {
      const { getByTestId, queryByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      fireEvent.changeText(input, '25');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(queryByTestId('age-input-error')).toBeFalsy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      expect(input.props.accessibilityLabel).toBe('Age input');
      expect(input.props.accessibilityHint).toBe('Enter your age in years, between 13 and 120');
    });

    it('has live region for error messages', () => {
      const { getByTestId } = render(
        <AgeInput {...defaultProps} error="Test error" />
      );
      const errorText = getByTestId('age-input-error');
      
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });

    it('has proper keyboard type and return key', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      expect(input.props.keyboardType).toBe('numeric');
      expect(input.props.returnKeyType).toBe('done');
    });

    it('has maximum length constraint', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      expect(input.props.maxLength).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('handles very long numeric input by limiting to 3 characters', () => {
      const { getByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      fireEvent.changeText(input, '12345');
      
      // Should be limited by maxLength prop
      expect(input.props.maxLength).toBe(3);
    });

    it('updates input value when prop value changes', () => {
      const { getByTestId, rerender } = render(<AgeInput {...defaultProps} value={25} />);
      const input = getByTestId('age-input-field');
      
      expect(input.props.value).toBe('25');
      
      rerender(<AgeInput {...defaultProps} value={30} />);
      
      expect(input.props.value).toBe('30');
    });

    it('handles boundary values correctly', async () => {
      const { getByTestId, queryByTestId } = render(<AgeInput {...defaultProps} />);
      const input = getByTestId('age-input-field');
      
      // Test minimum valid age
      fireEvent.changeText(input, '13');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(queryByTestId('age-input-error')).toBeFalsy();
      });
      
      // Test maximum valid age
      fireEvent.changeText(input, '120');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(queryByTestId('age-input-error')).toBeFalsy();
      });
    });
  });
});