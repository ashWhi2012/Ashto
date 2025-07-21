import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { HeightInput } from '../HeightInput';

describe('HeightInput', () => {
  const defaultProps = {
    value: 175, // cm
    unit: 'cm' as const,
    onValueChange: jest.fn(),
    onUnitChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props in cm mode', () => {
      const { getByTestId, getByText } = render(<HeightInput {...defaultProps} />);
      
      expect(getByText('Height')).toBeTruthy();
      expect(getByTestId('height-input-cm-field')).toBeTruthy();
      expect(getByTestId('height-input-unit-toggle')).toBeTruthy();
      expect(getByText('CM')).toBeTruthy();
    });

    it('renders with feet/inches mode', () => {
      const { getByTestId, getByText } = render(
        <HeightInput {...defaultProps} unit="ft_in" />
      );
      
      expect(getByTestId('height-input-feet-field')).toBeTruthy();
      expect(getByTestId('height-input-inches-field')).toBeTruthy();
      expect(getByText('ft')).toBeTruthy();
      expect(getByText('in')).toBeTruthy();
      expect(getByText('FT')).toBeTruthy();
    });

    it('renders with custom label and placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <HeightInput 
          {...defaultProps} 
          label="Body Height" 
          placeholder="Enter height here"
        />
      );
      
      expect(getByText('Body Height')).toBeTruthy();
      expect(getByPlaceholderText('Enter height here')).toBeTruthy();
    });

    it('displays conversion text in cm mode', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} value={175} />);
      
      expect(getByTestId('height-input-conversion')).toBeTruthy();
      expect(getByTestId('height-input-conversion').props.children).toContain("5' 9\"");
    });

    it('displays conversion text in ft_in mode', () => {
      const { getByTestId } = render(
        <HeightInput {...defaultProps} unit="ft_in" value={175} />
      );
      
      expect(getByTestId('height-input-conversion')).toBeTruthy();
      expect(getByTestId('height-input-conversion').props.children).toContain('175 cm');
    });
  });

  describe('CM Mode Input Handling', () => {
    it('calls onValueChange when valid number is entered in cm', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, '180');
      
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(180);
    });

    it('does not call onValueChange for invalid input in cm', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, 'abc');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('shows validation error for height too low in cm', async () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, '90');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('height-input-error')).toBeTruthy();
        expect(getByTestId('height-input-error').props.children).toContain('100 cm');
      });
    });

    it('shows validation error for height too high in cm', async () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, '300');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('height-input-error')).toBeTruthy();
        expect(getByTestId('height-input-error').props.children).toContain('250 cm');
      });
    });
  });

  describe('Feet/Inches Mode Input Handling', () => {
    const ftInProps = { ...defaultProps, unit: 'ft_in' as const };

    it('calls onValueChange when valid feet is entered', () => {
      const { getByTestId } = render(<HeightInput {...ftInProps} />);
      const feetInput = getByTestId('height-input-feet-field');
      
      fireEvent.changeText(feetInput, '6');
      
      // 6 feet 0 inches = 182.88 cm
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(182.88);
    });

    it('calls onValueChange when valid inches is entered', () => {
      const { getByTestId } = render(<HeightInput {...ftInProps} />);
      const feetInput = getByTestId('height-input-feet-field');
      const inchesInput = getByTestId('height-input-inches-field');
      
      // Set feet first
      fireEvent.changeText(feetInput, '5');
      fireEvent.changeText(inchesInput, '10');
      
      // 5 feet 10 inches = 177.8 cm
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(177.8);
    });

    it('does not call onValueChange for inches >= 12', () => {
      const { getByTestId } = render(<HeightInput {...ftInProps} />);
      const inchesInput = getByTestId('height-input-inches-field');
      
      jest.clearAllMocks();
      fireEvent.changeText(inchesInput, '15');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid inches', async () => {
      const { getByTestId } = render(<HeightInput {...ftInProps} />);
      const inchesInput = getByTestId('height-input-inches-field');
      
      fireEvent.changeText(inchesInput, '15');
      fireEvent(inchesInput, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('height-input-error')).toBeTruthy();
        expect(getByTestId('height-input-error').props.children).toBe('Inches must be between 0 and 11');
      });
    });

    it('shows validation error for height too low in ft_in', async () => {
      const { getByTestId } = render(<HeightInput {...ftInProps} />);
      const feetInput = getByTestId('height-input-feet-field');
      const inchesInput = getByTestId('height-input-inches-field');
      
      fireEvent.changeText(feetInput, '3');
      fireEvent.changeText(inchesInput, '0');
      fireEvent(inchesInput, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('height-input-error')).toBeTruthy();
        expect(getByTestId('height-input-error').props.children).toContain('3 feet 3 inches');
      });
    });
  });

  describe('Unit Conversion', () => {
    it('toggles unit from cm to ft_in', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} value={175} />);
      const unitButton = getByTestId('height-input-unit-toggle');
      
      fireEvent.press(unitButton);
      
      expect(defaultProps.onUnitChange).toHaveBeenCalledWith('ft_in');
    });

    it('toggles unit from ft_in to cm', () => {
      const { getByTestId } = render(
        <HeightInput {...defaultProps} unit="ft_in" value={175} />
      );
      const unitButton = getByTestId('height-input-unit-toggle');
      
      fireEvent.press(unitButton);
      
      expect(defaultProps.onUnitChange).toHaveBeenCalledWith('cm');
    });

    it('converts cm to feet/inches correctly', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} value={175} />);
      const conversionText = getByTestId('height-input-conversion');
      
      expect(conversionText.props.children).toBe("≈ 5' 9\"");
    });

    it('converts feet/inches to cm correctly', () => {
      const { getByTestId } = render(
        <HeightInput {...defaultProps} unit="ft_in" value={175} />
      );
      const conversionText = getByTestId('height-input-conversion');
      
      expect(conversionText.props.children).toBe('≈ 175 cm');
    });
  });

  describe('Validation', () => {
    it('shows validation error for invalid cm input', async () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, 'invalid');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('height-input-error')).toBeTruthy();
        expect(getByTestId('height-input-error').props.children).toBe('Please enter a valid height');
      });
    });

    it('displays external error prop', () => {
      const { getByTestId } = render(
        <HeightInput {...defaultProps} error="External error message" />
      );
      
      expect(getByTestId('height-input-error')).toBeTruthy();
      expect(getByTestId('height-input-error').props.children).toBe('External error message');
    });

    it('clears validation error when user starts typing in cm', async () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      // Create validation error
      fireEvent.changeText(input, 'invalid');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(getByTestId('height-input-error')).toBeTruthy();
      });
      
      // Start typing again
      fireEvent.changeText(input, '180');
      
      // Error should be cleared internally (though external error might still show)
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for cm mode', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      const unitButton = getByTestId('height-input-unit-toggle');
      
      expect(input.props.accessibilityLabel).toBe('Height input in centimeters');
      expect(input.props.accessibilityHint).toBe('Enter your height in centimeters');
      expect(unitButton.props.accessibilityLabel).toBe('Unit selector, currently centimeters');
      expect(unitButton.props.accessibilityHint).toBe('Tap to switch between centimeters and feet/inches');
      expect(unitButton.props.accessibilityRole).toBe('button');
    });

    it('has proper accessibility labels for ft_in mode', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} unit="ft_in" />);
      const feetInput = getByTestId('height-input-feet-field');
      const inchesInput = getByTestId('height-input-inches-field');
      const unitButton = getByTestId('height-input-unit-toggle');
      
      expect(feetInput.props.accessibilityLabel).toBe('Height feet input');
      expect(feetInput.props.accessibilityHint).toBe('Enter feet portion of your height');
      expect(inchesInput.props.accessibilityLabel).toBe('Height inches input');
      expect(inchesInput.props.accessibilityHint).toBe('Enter inches portion of your height, 0 to 11');
      expect(unitButton.props.accessibilityLabel).toBe('Unit selector, currently feet and inches');
    });

    it('has live region for error messages', () => {
      const { getByTestId } = render(
        <HeightInput {...defaultProps} error="Test error" />
      );
      const errorText = getByTestId('height-input-error');
      
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input gracefully in cm mode', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, '');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('handles zero input in cm mode', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} />);
      const input = getByTestId('height-input-cm-field');
      
      fireEvent.changeText(input, '0');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('handles negative input in feet', () => {
      const { getByTestId } = render(<HeightInput {...defaultProps} unit="ft_in" />);
      const feetInput = getByTestId('height-input-feet-field');
      
      fireEvent.changeText(feetInput, '-1');
      
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    it('updates input values when prop value changes', () => {
      const { getByTestId, rerender } = render(<HeightInput {...defaultProps} value={175} />);
      const input = getByTestId('height-input-cm-field');
      
      expect(input.props.value).toBe('175');
      
      rerender(<HeightInput {...defaultProps} value={180} />);
      
      expect(input.props.value).toBe('180');
    });

    it('properly initializes feet/inches from cm value', () => {
      const { getByTestId } = render(
        <HeightInput {...defaultProps} unit="ft_in" value={175} />
      );
      const feetInput = getByTestId('height-input-feet-field');
      const inchesInput = getByTestId('height-input-inches-field');
      
      // 175 cm = 5 feet 9 inches
      expect(feetInput.props.value).toBe('5');
      expect(inchesInput.props.value).toBe('9');
    });
  });
});