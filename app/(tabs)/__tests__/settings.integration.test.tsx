import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { UserProfileProvider } from '../../../contexts/UserProfileContext';
import Settings from '../settings';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <UserProfileProvider>
      {children}
    </UserProfileProvider>
  </ThemeProvider>
);

describe('Settings Integration Tests - Personal Information', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Personal Information Section', () => {
    it('renders personal information section with progress indicator', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      expect(personalInfoToggle).toBeTruthy();
      expect(getByText('Personal Information')).toBeTruthy();
      expect(getByText('Manage your personal information for calorie calculations')).toBeTruthy();
    });

    it('shows and hides personal information content when toggled', async () => {
      const { getByTestId, queryByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      
      // Initially hidden
      expect(queryByTestId('personal-info-content')).toBeFalsy();

      // Show content
      fireEvent.press(personalInfoToggle);
      await waitFor(() => {
        expect(queryByTestId('personal-info-content')).toBeTruthy();
      });

      // Hide content
      fireEvent.press(personalInfoToggle);
      await waitFor(() => {
        expect(queryByTestId('personal-info-content')).toBeFalsy();
      });
    });

    it('displays all profile input components when expanded', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        expect(getByTestId('settings-age-input')).toBeTruthy();
        expect(getByTestId('settings-weight-input')).toBeTruthy();
        expect(getByTestId('settings-height-input')).toBeTruthy();
        expect(getByTestId('settings-sex-selector')).toBeTruthy();
        expect(getByTestId('save-profile-button')).toBeTruthy();
      });
    });

    it('updates profile data when input values change', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const ageInput = getByTestId('settings-age-input-field');
        const weightInput = getByTestId('settings-weight-input-field');
        
        fireEvent.changeText(ageInput, '25');
        fireEvent.changeText(weightInput, '75');
        
        expect(ageInput.props.value).toBe('25');
        expect(weightInput.props.value).toBe('75');
      });
    });

    it('saves profile successfully and shows success message', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const saveButton = getByTestId('save-profile-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(getByTestId('save-message-success')).toBeTruthy();
        expect(getByText('Profile saved successfully!')).toBeTruthy();
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'userProfile',
        expect.stringContaining('"age":30')
      );
    });

    it('shows error message when save fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const saveButton = getByTestId('save-profile-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(getByTestId('save-message-error')).toBeTruthy();
        expect(getByText('Failed to save profile. Please try again.')).toBeTruthy();
      });
    });

    it('disables save button while saving', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const saveButton = getByTestId('save-profile-button');
        fireEvent.press(saveButton);
        
        expect(getByText('Saving...')).toBeTruthy();
        expect(saveButton.props.accessibilityState?.disabled).toBe(true);
      });
    });

    it('displays validation errors when profile is invalid', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const ageInput = getByTestId('settings-age-input-field');
        fireEvent.changeText(ageInput, '0'); // Invalid age
        fireEvent.blur(ageInput);
      });

      await waitFor(() => {
        const validationErrors = getByTestId('validation-errors');
        expect(validationErrors).toBeTruthy();
      });
    });

    it('updates progress indicator based on profile completeness', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const ageInput = getByTestId('settings-age-input-field');
        const weightInput = getByTestId('settings-weight-input-field');
        
        fireEvent.changeText(ageInput, '25');
        fireEvent.changeText(weightInput, '75');
        
        // Progress should update based on completed fields
        const progressText = getByTestId('personal-info-toggle').children[1].children[0].children[0];
        expect(progressText.children[0]).toMatch(/\d+%/);
      });
    });

    it('integrates with theme system for consistent styling', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const saveButton = getByTestId('save-profile-button');
        expect(saveButton.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              backgroundColor: expect.any(String),
            })
          ])
        );
      });
    });

    it('clears success message after timeout', async () => {
      jest.useFakeTimers();
      
      const { getByTestId, queryByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const saveButton = getByTestId('save-profile-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(queryByTestId('save-message-success')).toBeTruthy();
      });

      // Fast forward 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(queryByTestId('save-message-success')).toBeFalsy();
      });

      jest.useRealTimers();
    });

    it('handles unit changes for weight and height', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      await waitFor(() => {
        const weightUnitToggle = getByTestId('settings-weight-input-unit-toggle');
        const heightUnitToggle = getByTestId('settings-height-input-unit-toggle');
        
        fireEvent.press(weightUnitToggle);
        fireEvent.press(heightUnitToggle);
        
        // Units should change and values should be converted
        expect(weightUnitToggle.children[0]).toBe('lbs');
        expect(heightUnitToggle.children[0]).toBe('FT');
      });
    });
  });

  describe('Integration with existing Settings functionality', () => {
    it('personal information section works alongside theme selection', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Expand personal info
      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      // Should still be able to change themes
      const darkThemeCard = getByText('Dark Mode').parent?.parent;
      if (darkThemeCard) {
        fireEvent.press(darkThemeCard);
      }

      await waitFor(() => {
        expect(getByTestId('settings-age-input')).toBeTruthy();
        // Theme should have changed but personal info should still be visible
      });
    });

    it('personal information section works alongside category management', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Expand personal info
      const personalInfoToggle = getByTestId('personal-info-toggle');
      fireEvent.press(personalInfoToggle);

      // Should still be able to manage categories
      const addCategoryButton = getByText('Add New Category');
      fireEvent.press(addCategoryButton);

      await waitFor(() => {
        expect(getByTestId('settings-age-input')).toBeTruthy();
        // Category modal should open but personal info should still be expanded
      });
    });
  });
});