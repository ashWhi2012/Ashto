import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { UserProfile, WorkoutData } from '../../utils/calorieCalculator';
import { CalorieCalculationResult, WorkoutSummaryModal, WorkoutSummaryModalProps } from '../WorkoutSummaryModal';

// Mock the theme context
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      surface: '#ffffff',
      text: '#333333',
      textSecondary: '#666666',
      primary: '#4CAF50',
      warning: '#FF9800',
      success: '#4CAF50',
      error: '#f44336',
      buttonText: '#FFFFFF',
    },
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
  }));
  RN.Animated.spring = jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
  }));
  RN.Animated.parallel = jest.fn((animations) => ({
    start: jest.fn((callback) => callback && callback()),
  }));
  RN.Animated.Value = jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(() => 'listener-id'),
    removeListener: jest.fn(),
  }));
  return RN;
});

const mockUserProfile: UserProfile = {
  age: 30,
  sex: 'male',
  weight: 70,
  height: 175,
  activityLevel: 'moderately_active',
  weightUnit: 'kg',
  heightUnit: 'cm',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockWorkoutData: WorkoutData = {
  exercises: [
    { name: 'Push-ups', sets: 3, reps: 15, weight: 0 },
    { name: 'Squats', sets: 3, reps: 20, weight: 0 },
    { name: 'Bench Press', sets: 3, reps: 10, weight: 60 },
  ],
  duration: 45,
};

const mockCalorieResultComplete: CalorieCalculationResult = {
  totalCalories: 285.5,
  exerciseBreakdown: [
    { name: 'Push-ups', calories: 95.2, intensity: 'moderate', metValue: 4.5 },
    { name: 'Squats', calories: 110.8, intensity: 'moderate', metValue: 5.5 },
    { name: 'Bench Press', calories: 79.5, intensity: 'vigorous', metValue: 6.0 },
  ],
  averageMET: 5.3,
  calculationMethod: 'complete_profile',
  profileCompleteness: 100,
  recommendations: [],
};

const mockCalorieResultDefaults: CalorieCalculationResult = {
  totalCalories: 250.0,
  exerciseBreakdown: [
    { name: 'Push-ups', calories: 85.0, intensity: 'moderate', metValue: 4.5 },
    { name: 'Squats', calories: 95.0, intensity: 'moderate', metValue: 5.5 },
    { name: 'Bench Press', calories: 70.0, intensity: 'vigorous', metValue: 6.0 },
  ],
  averageMET: 5.3,
  calculationMethod: 'default_values',
  profileCompleteness: 25,
  recommendations: ['Complete your profile for more accurate calculations'],
};

const defaultProps: WorkoutSummaryModalProps = {
  visible: true,
  onClose: jest.fn(),
  workoutData: mockWorkoutData,
  calorieResult: mockCalorieResultComplete,
  userProfile: mockUserProfile,
};

const renderModal = (props: Partial<WorkoutSummaryModalProps> = {}) => {
  return render(
    <ThemeProvider>
      <WorkoutSummaryModal {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('WorkoutSummaryModal - Calorie Display Formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Total Calories Display', () => {
    it('should display total calories rounded to whole numbers', () => {
      const { getByText } = renderModal();
      
      // Check that total calories are rounded (285.5 -> 286)
      expect(getByText('286 kcal')).toBeTruthy();
    });

    it('should display total calories in the main counter section', () => {
      const { getByText } = renderModal();
      
      // Check main calorie counter displays rounded value
      expect(getByText('286')).toBeTruthy();
      expect(getByText('kcal')).toBeTruthy();
    });

    it('should display total calories in the breakdown section', () => {
      const { getByText } = renderModal();
      
      // Check breakdown section shows rounded total
      expect(getByText('Total Calories Burned')).toBeTruthy();
      expect(getByText('286 kcal')).toBeTruthy();
    });
  });

  describe('Exercise-by-Exercise Breakdown', () => {
    it('should display individual exercise calories rounded to whole numbers', () => {
      const { getByText } = renderModal();
      
      // Check individual exercise calories are rounded
      expect(getByText('95')).toBeTruthy(); // 95.2 -> 95
      expect(getByText('111')).toBeTruthy(); // 110.8 -> 111
      expect(getByText('80')).toBeTruthy(); // 79.5 -> 80
    });

    it('should display exercise names and details correctly', () => {
      const { getByText } = renderModal();
      
      expect(getByText('Push-ups')).toBeTruthy();
      expect(getByText('Squats')).toBeTruthy();
      expect(getByText('Bench Press')).toBeTruthy();
      
      expect(getByText('moderate intensity • 4.5 MET')).toBeTruthy();
      expect(getByText('moderate intensity • 5.5 MET')).toBeTruthy();
      expect(getByText('vigorous intensity • 6 MET')).toBeTruthy();
    });

    it('should display kcal unit for each exercise', () => {
      const { getAllByText } = renderModal();
      
      // Should have multiple kcal units (one for each exercise + total)
      const kcalTexts = getAllByText('kcal');
      expect(kcalTexts.length).toBeGreaterThan(3); // At least 4 (3 exercises + 1 total + main counter)
    });
  });

  describe('Calculation Method Indicator', () => {
    it('should show complete profile method when using personal profile', () => {
      const { getByText } = renderModal();
      
      expect(getByText('Calculation Method')).toBeTruthy();
      expect(getByText('Your personal profile')).toBeTruthy();
    });

    it('should show default values method when using defaults', () => {
      const { getByText } = renderModal({
        calorieResult: mockCalorieResultDefaults,
        userProfile: null,
      });
      
      expect(getByText('Calculation Method')).toBeTruthy();
      expect(getByText('Default profile values (70kg, 30yr, male)')).toBeTruthy();
    });
  });

  describe('Profile Completion Encouragement', () => {
    it('should show warning when using default values', () => {
      const { getByText } = renderModal({
        calorieResult: mockCalorieResultDefaults,
        userProfile: null,
      });
      
      expect(getByText('Using Default Values')).toBeTruthy();
      expect(getByText('Complete your profile in Settings for more accurate calorie calculations.')).toBeTruthy();
      expect(getByText('Profile completeness: 25%')).toBeTruthy();
    });

    it('should not show warning when using complete profile', () => {
      const { queryByText } = renderModal();
      
      expect(queryByText('Using Default Values')).toBeNull();
      expect(queryByText('Complete your profile in Settings for more accurate calorie calculations.')).toBeNull();
    });

    it('should display accuracy indicator with correct percentage', () => {
      const { getByText } = renderModal({
        calorieResult: mockCalorieResultDefaults,
      });
      
      expect(getByText('Calculation Accuracy')).toBeTruthy();
      expect(getByText('25%')).toBeTruthy();
    });

    it('should display high accuracy for complete profile', () => {
      const { getByText } = renderModal();
      
      expect(getByText('Calculation Accuracy')).toBeTruthy();
      expect(getByText('100%')).toBeTruthy();
    });
  });

  describe('Duration and Exercise Summary', () => {
    it('should format duration correctly for minutes only', () => {
      const { getByText } = renderModal();
      
      expect(getByText('45 min')).toBeTruthy();
    });

    it('should format duration correctly for hours and minutes', () => {
      const { getByText } = renderModal({
        workoutData: { ...mockWorkoutData, duration: 90 },
      });
      
      expect(getByText('1h 30m')).toBeTruthy();
    });

    it('should format duration correctly for hours only', () => {
      const { getByText } = renderModal({
        workoutData: { ...mockWorkoutData, duration: 120 },
      });
      
      expect(getByText('2h')).toBeTruthy();
    });

    it('should display exercise types summary', () => {
      const { getByText } = renderModal();
      
      expect(getByText('Push-ups, Squats & 1 more')).toBeTruthy();
    });

    it('should display average MET value', () => {
      const { getByText } = renderModal();
      
      expect(getByText('5.3')).toBeTruthy();
    });
  });

  describe('Modal Interaction', () => {
    it('should call onClose when close button is pressed', () => {
      const onCloseMock = jest.fn();
      const { getByLabelText } = renderModal({ onClose: onCloseMock });
      
      const closeButton = getByLabelText('Close');
      fireEvent.press(closeButton);
      
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is pressed', () => {
      const onCloseMock = jest.fn();
      const { getByLabelText } = renderModal({ onClose: onCloseMock });
      
      const backdrop = getByLabelText('Close workout summary');
      fireEvent.press(backdrop);
      
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should call onClose when Done button is pressed', () => {
      const onCloseMock = jest.fn();
      const { getByLabelText } = renderModal({ onClose: onCloseMock });
      
      const doneButton = getByLabelText('Done');
      fireEvent.press(doneButton);
      
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty exercise breakdown', () => {
      const emptyCalorieResult: CalorieCalculationResult = {
        ...mockCalorieResultComplete,
        exerciseBreakdown: [],
        totalCalories: 0,
      };

      const { getByText } = renderModal({
        calorieResult: emptyCalorieResult,
      });
      
      expect(getByText('0 kcal')).toBeTruthy();
    });

    it('should handle very large calorie numbers', () => {
      const largeCalorieResult: CalorieCalculationResult = {
        ...mockCalorieResultComplete,
        totalCalories: 1234.56,
        exerciseBreakdown: [
          { name: 'Marathon', calories: 1234.56, intensity: 'vigorous', metValue: 12.0 },
        ],
      };

      const { getByText } = renderModal({
        calorieResult: largeCalorieResult,
      });
      
      expect(getByText('1235 kcal')).toBeTruthy(); // Rounded
      expect(getByText('1235')).toBeTruthy(); // In breakdown
    });

    it('should handle zero calorie exercises', () => {
      const zeroCalorieResult: CalorieCalculationResult = {
        ...mockCalorieResultComplete,
        exerciseBreakdown: [
          { name: 'Rest', calories: 0, intensity: 'light', metValue: 1.0 },
        ],
      };

      const { getByText } = renderModal({
        calorieResult: zeroCalorieResult,
      });
      
      expect(getByText('0')).toBeTruthy();
    });
  });
});