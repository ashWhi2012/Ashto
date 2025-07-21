import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SexSelector } from '../SexSelector';

describe('SexSelector', () => {
  const defaultProps = {
    value: 'male' as const,
    onValueChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId, getByText } = render(<SexSelector {...defaultProps} />);
      
      expect(getByText('Sex')).toBeTruthy();
      expect(getByTestId('sex-selector-male')).toBeTruthy();
      expect(getByTestId('sex-selector-female')).toBeTruthy();
      expect(getByTestId('sex-selector-other')).toBeTruthy();
    });

    it('renders with custom label', () => {
      const { getByText } = render(
        <SexSelector {...defaultProps} label="Gender" />
      );
      
      expect(getByText('Gender')).toBeTruthy();
    });

    it('shows all three options', () => {
      const { getByText } = render(<SexSelector {...defaultProps} />);
      
      expect(getByText('Male')).toBeTruthy();
      expect(getByText('Female')).toBeTruthy();
      expect(getByText('Other')).toBeTruthy();
    });

    it('highlights the selected option', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="female" />);
      const femaleOption = getByTestId('sex-selector-female');
      const maleOption = getByTestId('sex-selector-male');
      
      // Female should be selected (highlighted)
      expect(femaleOption.props.accessibilityState.checked).toBe(true);
      expect(femaleOption.props.accessibilityState.selected).toBe(true);
      
      // Male should not be selected
      expect(maleOption.props.accessibilityState.checked).toBe(false);
      expect(maleOption.props.accessibilityState.selected).toBe(false);
    });
  });

  describe('Selection Handling', () => {
    it('calls onValueChange when male is selected', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="female" />);
      const maleOption = getByTestId('sex-selector-male');
      
      fireEvent.press(maleOption);
      
      expect(defaultProps.onValueChange).toHaveBeenCalledWith('male');
    });

    it('calls onValueChange when female is selected', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="male" />);
      const femaleOption = getByTestId('sex-selector-female');
      
      fireEvent.press(femaleOption);
      
      expect(defaultProps.onValueChange).toHaveBeenCalledWith('female');
    });

    it('calls onValueChange when other is selected', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="male" />);
      const otherOption = getByTestId('sex-selector-other');
      
      fireEvent.press(otherOption);
      
      expect(defaultProps.onValueChange).toHaveBeenCalledWith('other');
    });

    it('can select the same option multiple times', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="male" />);
      const maleOption = getByTestId('sex-selector-male');
      
      fireEvent.press(maleOption);
      fireEvent.press(maleOption);
      
      expect(defaultProps.onValueChange).toHaveBeenCalledTimes(2);
      expect(defaultProps.onValueChange).toHaveBeenCalledWith('male');
    });
  });

  describe('Visual States', () => {
    it('shows radio button selected state for male', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="male" />);
      const maleOption = getByTestId('sex-selector-male');
      
      expect(maleOption.props.accessibilityState.checked).toBe(true);
    });

    it('shows radio button selected state for female', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="female" />);
      const femaleOption = getByTestId('sex-selector-female');
      
      expect(femaleOption.props.accessibilityState.checked).toBe(true);
    });

    it('shows radio button selected state for other', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="other" />);
      const otherOption = getByTestId('sex-selector-other');
      
      expect(otherOption.props.accessibilityState.checked).toBe(true);
    });

    it('only one option is selected at a time', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="female" />);
      
      const maleOption = getByTestId('sex-selector-male');
      const femaleOption = getByTestId('sex-selector-female');
      const otherOption = getByTestId('sex-selector-other');
      
      expect(maleOption.props.accessibilityState.checked).toBe(false);
      expect(femaleOption.props.accessibilityState.checked).toBe(true);
      expect(otherOption.props.accessibilityState.checked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when provided', () => {
      const { getByTestId } = render(
        <SexSelector {...defaultProps} error="Please select your sex" />
      );
      
      expect(getByTestId('sex-selector-error')).toBeTruthy();
      expect(getByTestId('sex-selector-error').props.children).toBe('Please select your sex');
    });

    it('does not display error message when not provided', () => {
      const { queryByTestId } = render(<SexSelector {...defaultProps} />);
      
      expect(queryByTestId('sex-selector-error')).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('has proper radiogroup role for container', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} />);
      const container = getByTestId('sex-selector');
      
      // Find the options container within the main container
      const optionsContainer = container.findByProps({ accessibilityRole: 'radiogroup' });
      expect(optionsContainer).toBeTruthy();
    });

    it('has proper radio role for each option', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} />);
      
      const maleOption = getByTestId('sex-selector-male');
      const femaleOption = getByTestId('sex-selector-female');
      const otherOption = getByTestId('sex-selector-other');
      
      expect(maleOption.props.accessibilityRole).toBe('radio');
      expect(femaleOption.props.accessibilityRole).toBe('radio');
      expect(otherOption.props.accessibilityRole).toBe('radio');
    });

    it('has proper accessibility labels', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} />);
      
      const maleOption = getByTestId('sex-selector-male');
      const femaleOption = getByTestId('sex-selector-female');
      const otherOption = getByTestId('sex-selector-other');
      
      expect(maleOption.props.accessibilityLabel).toBe('Male');
      expect(femaleOption.props.accessibilityLabel).toBe('Female');
      expect(otherOption.props.accessibilityLabel).toBe('Other');
    });

    it('has proper accessibility hints', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} />);
      
      const maleOption = getByTestId('sex-selector-male');
      const femaleOption = getByTestId('sex-selector-female');
      const otherOption = getByTestId('sex-selector-other');
      
      expect(maleOption.props.accessibilityHint).toBe('Select Male as your sex');
      expect(femaleOption.props.accessibilityHint).toBe('Select Female as your sex');
      expect(otherOption.props.accessibilityHint).toBe('Select Other as your sex');
    });

    it('has proper accessibility state for selected option', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="female" />);
      const femaleOption = getByTestId('sex-selector-female');
      
      expect(femaleOption.props.accessibilityState).toEqual({
        checked: true,
        selected: true,
      });
    });

    it('has proper accessibility state for unselected options', () => {
      const { getByTestId } = render(<SexSelector {...defaultProps} value="female" />);
      const maleOption = getByTestId('sex-selector-male');
      
      expect(maleOption.props.accessibilityState).toEqual({
        checked: false,
        selected: false,
      });
    });

    it('has live region for error messages', () => {
      const { getByTestId } = render(
        <SexSelector {...defaultProps} error="Test error" />
      );
      const errorText = getByTestId('sex-selector-error');
      
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles all valid sex values', () => {
      const validValues: Array<'male' | 'female' | 'other'> = ['male', 'female', 'other'];
      
      validValues.forEach(value => {
        const { getByTestId } = render(<SexSelector {...defaultProps} value={value} />);
        const option = getByTestId(`sex-selector-${value}`);
        
        expect(option.props.accessibilityState.checked).toBe(true);
      });
    });

    it('maintains selection state correctly when value changes', () => {
      const { getByTestId, rerender } = render(<SexSelector {...defaultProps} value="male" />);
      
      let maleOption = getByTestId('sex-selector-male');
      let femaleOption = getByTestId('sex-selector-female');
      
      expect(maleOption.props.accessibilityState.checked).toBe(true);
      expect(femaleOption.props.accessibilityState.checked).toBe(false);
      
      rerender(<SexSelector {...defaultProps} value="female" />);
      
      maleOption = getByTestId('sex-selector-male');
      femaleOption = getByTestId('sex-selector-female');
      
      expect(maleOption.props.accessibilityState.checked).toBe(false);
      expect(femaleOption.props.accessibilityState.checked).toBe(true);
    });
  });
});