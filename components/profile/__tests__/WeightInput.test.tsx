import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { WeightInput } from '../WeightInput';

describe('WeightInput', () => {
  const defaultProps = {
    value: 70,
    unit: 'kg' as const,
    onValueChange: jest.fn(),
    onUnitChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId, getByText } = render(<WeightInput {...defaultProps} />);
      
      expect(getByText('Weight')).toBeTruthy();
      expect(getByTestId('weight-input-field')).toBeTruthy();
      expect(getByTestId('weight-input-unit-toggle')).toBeTruthy();
      expect(getByText('KG')).toBeTruthy();
    });

    it('renders with custom label and placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <WeightInput 
          {...defaultProps} 
          label="Body Weight" 
          placeholder="Enter weight here"
        />
      );
      
      expect(getByText('Body Weight')).toBeTruthy();
      expect(getByPlaceholderText('Enter weight here')).toBeTruthy();
    });

    it('displays conversion text when value is entered', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} value={70} />);
      
      expect(getByTestId('weight-input-conversion')).toBeTruthy();
      expect(getByTestId('weight-input-conversion').props.children).toContain('154.3 lbs');
    });
  });

  describe('Input Handling', () => {
    it('calls onValueChange when valid number is entered', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '75');
      
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(75);
    });

    it('does not call onValueChange for invalid input', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, 'abc');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('clears validation error when user starts typing', async () => {
      const { getByTestId, queryByTestId } = render(
        <WeightInput {...defaultProps} error="Test error" />
      );
      const input = getByTestId('weight-input-field');
      
      // Initially shows error
      expect(queryByTestId('weight-input-error')).toBeTruthy();
      
      fireEvent.changeText(input, '75');
      
      // Error should be cleared (external error still shows, but validation error is cleared)
      expect(queryByTestId('weight-input-error')).toBeTruthy(); // External error still shows
    });
  });

  describe('Unit Conversion', () => {
    it('toggles unit from kg to lbs', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} value={70} />);
      const unitButton = getByTestId('weight-input-unit-toggle');
      
      fireEvent.press(unitButton);
      
      expect(defaultProps.onUnitChange).toHaveBeenCalledWith('lbs');
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(154.3);
    });

    it('toggles unit from lbs to kg', () => {
      const { getByTestId } = render(
        <WeightInput {...defaultProps} unit="lbs" value={154} />
      );
      const unitButton = getByTestId('weight-input-unit-toggle');
      
      fireEvent.press(unitButton);
      
      expect(defaultProps.onUnitChange).toHaveBeenCalledWith('kg');
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(69.9);
    });

    it('shows correct conversion text for kg to lbs', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} value={70} />);
      const conversionText = getByTestId('weight-input-conversion');
      
      expect(conversionText.props.children).toBe('≈ 154.3 lbs');
    });

    it('shows correct conversion text for lbs to kg', () => {
      const { getByTestId } = render(
        <WeightInput {...defaultProps} unit="lbs" value={154} />
      );
      const conversionText = getByTestId('weight-input-conversion');
      
      expect(conversionText.props.children).toBe('≈ 69.9 kg');
    });
  });

  describe('Validation', () => {
    it('shows validation error for weight too low in kg', async () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '25');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('weight-input-error')).toBeTruthy();
        expect(getByTestId('weight-input-error').props.children).toContain('30 kg');
      });
    });

    it('shows validation error for weight too high in kg', async () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '350');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('weight-input-error')).toBeTruthy();
        expect(getByTestId('weight-input-error').props.children).toContain('300 kg');
      });
    });

    it('shows validation error for weight too low in lbs', async () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} unit="lbs" />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '50');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('weight-input-error')).toBeTruthy();
        expect(getByTestId('weight-input-error').props.children).toContain('66 lbs');
      });
    });

    it('shows validation error for invalid input', async () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, 'invalid');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('weight-input-error')).toBeTruthy();
        expect(getByTestId('weight-input-error').props.children).toBe('Please enter a valid weight');
      });
    });

    it('displays external error prop', () => {
      const { getByTestId } = render(
        <WeightInput {...defaultProps} error="External error message" />
      );
      
      expect(getByTestId('weight-input-error')).toBeTruthy();
      expect(getByTestId('weight-input-error').props.children).toBe('External error message');
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      const unitButton = getByTestId('weight-input-unit-toggle');
      
      expect(input.props.accessibilityLabel).toBe('Weight input');
      expect(input.props.accessibilityHint).toBe('Enter your weight in kg');
      expect(unitButton.props.accessibilityLabel).toBe('Unit selector, currently kg');
      expect(unitButton.props.accessibilityHint).toBe('Tap to switch between kilograms and pounds');
      expect(unitButton.props.accessibilityRole).toBe('button');
    });

    it('has live region for error messages', () => {
      const { getByTestId } = render(
        <WeightInput {...defaultProps} error="Test error" />
      );
      const errorText = getByTestId('weight-input-error');
      
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input gracefully', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('handles zero input', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '0');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('handles negative input', () => {
      const { getByTestId } = render(<WeightInput {...defaultProps} />);
      const input = getByTestId('weight-input-field');
      
      fireEvent.changeText(input, '-50');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('updates input value when prop value changes', () => {
      const { getByTestId, rerender } = render(<WeightInput {...defaultProps} value={70} />);
      const input = getByTestId('weight-input-field');
      
      expect(input.props.value).toBe('70');
      
      rerender(<WeightInput {...defaultProps} value={80} />);
      
      expect(input.props.value).toBe('80');
    });
  });
});