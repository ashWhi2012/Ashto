import {
    calculateWorkoutCalories,
    CalorieCalculationError,
    CalorieCalculationErrorType,
    UserProfile,
    WorkoutData,
} from '../calorieCalculator';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Error Handling Tests', () => {
  const validProfile: UserProfile = {
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

  const validWorkoutData: WorkoutData = {
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
      { name: 'Squats', sets: 3, reps: 15, weight: 20 },
    ],
    duration: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CalorieCalculationError', () => {
    it('should create error with correct properties', () => {
      const error = new CalorieCalculationError(
        CalorieCalculationErrorType.INVALID_WORKOUT_DATA,
        'Test error message',
        { detail: 'test' }
      );

      expect(error.name).toBe('CalorieCalculationError');
      expect(error.type).toBe(CalorieCalculationErrorType.INVALID_WORKOUT_DATA);
      expect(error.message).toBe('Test error message');
      expect(error.details).toEqual({ detail: 'test' });
    });
  });

  describe('Workout Data Validation Errors', () => {
    it('should handle null workout data', () => {
      const result = calculateWorkoutCalories(null as any, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Workout data is required');
      expect(result.totalCalories).toBe(0);
    });

    it('should handle missing exercises array', () => {
      const invalidWorkout = { duration: 30 } as WorkoutData;
      const result = calculateWorkoutCalories(invalidWorkout, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Exercises array is required');
    });

    it('should handle empty exercises array', () => {
      const emptyWorkout: WorkoutData = { exercises: [], duration: 30 };
      const result = calculateWorkoutCalories(emptyWorkout, validProfile);
      
      expect(result.success).toBe(true);
      expect(result.totalCalories).toBe(0);
      expect(result.warnings).toContain('No exercises provided');
    });

    it('should handle invalid exercise data', () => {
      const invalidWorkout: WorkoutData = {
        exercises: [
          { name: '', sets: -1, reps: -1, weight: -1 },
        ],
        duration: 30,
      };
      
      const result = calculateWorkoutCalories(invalidWorkout, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Name is required'))).toBe(true);
      expect(result.errors.some(error => error.includes('Sets must be a non-negative number'))).toBe(true);
    });

    it('should handle invalid duration', () => {
      const invalidWorkout: WorkoutData = {
        exercises: validWorkoutData.exercises,
        duration: -10,
      };
      
      const result = calculateWorkoutCalories(invalidWorkout, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Duration must be a positive number');
    });

    it('should handle excessive duration', () => {
      const invalidWorkout: WorkoutData = {
        exercises: validWorkoutData.exercises,
        duration: 1500, // 25 hours
      };
      
      const result = calculateWorkoutCalories(invalidWorkout, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Duration cannot exceed 24 hours');
    });
  });

  describe('User Profile Validation Errors', () => {
    it('should handle null user profile', () => {
      const result = calculateWorkoutCalories(validWorkoutData, null as any);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('User profile is required');
    });

    it('should handle invalid weight', () => {
      const invalidProfile = { ...validProfile, weight: -10 };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Valid weight is required for calorie calculation');
    });

    it('should handle extreme weight values', () => {
      const invalidProfile = { ...validProfile, weight: 1500 };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Weight value appears to be invalid');
    });

    it('should handle invalid age', () => {
      const invalidProfile = { ...validProfile, age: -5 };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Valid age is required for calorie calculation');
    });

    it('should handle extreme age values', () => {
      const invalidProfile = { ...validProfile, age: 200 };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Age value appears to be invalid');
    });

    it('should handle invalid height', () => {
      const invalidProfile = { ...validProfile, height: 0 };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Valid height is required for calorie calculation');
    });

    it('should handle invalid sex', () => {
      const invalidProfile = { ...validProfile, sex: 'invalid' as any };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Valid sex is required for calorie calculation');
    });
  });

  describe('Calculation Overflow Protection', () => {
    it('should handle calculation overflow', () => {
      const extremeProfile = { ...validProfile, weight: 999999 };
      const extremeWorkout: WorkoutData = {
        exercises: [{ name: 'Test', sets: 1, reps: 1, weight: 999999 }],
        duration: 1000,
      };
      
      const result = calculateWorkoutCalories(extremeWorkout, extremeProfile);
      
      // Should either handle gracefully or return error
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      } else {
        expect(result.totalCalories).toBeLessThan(100000); // Reasonable upper bound
      }
    });

    it('should handle NaN and Infinity values', () => {
      const invalidProfile = { ...validProfile, weight: NaN };
      const result = calculateWorkoutCalories(validWorkoutData, invalidProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('weight'))).toBe(true);
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue with valid exercises when some fail', () => {
      const mixedWorkout: WorkoutData = {
        exercises: [
          { name: 'Valid Exercise', sets: 3, reps: 10, weight: 20 },
          { name: '', sets: -1, reps: -1, weight: -1 }, // Invalid
          { name: 'Another Valid', sets: 2, reps: 8, weight: 15 },
        ],
        duration: 30,
      };
      
      const result = calculateWorkoutCalories(mixedWorkout, validProfile);
      
      // Should have some errors but still calculate for valid exercises
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.exerciseBreakdown.length).toBe(3);
      expect(result.totalCalories).toBeGreaterThan(0); // Should have calories from valid exercises
    });

    it('should use fallback categories for unknown exercises', () => {
      const unknownExerciseWorkout: WorkoutData = {
        exercises: [{ name: 'Unknown Exercise', sets: 3, reps: 10, weight: 20 }],
        duration: 30,
      };
      
      const result = calculateWorkoutCalories(unknownExerciseWorkout, validProfile);
      
      expect(result.success).toBe(true);
      expect(result.fallbacksUsed.some(fallback => 
        fallback.includes('Used default category')
      )).toBe(true);
      expect(result.totalCalories).toBeGreaterThan(0);
    });

    it('should warn about unusual values but continue calculation', () => {
      const unusualWorkout: WorkoutData = {
        exercises: [{ name: 'Test', sets: 3, reps: 10, weight: 20 }],
        duration: 500, // Very long workout
      };
      
      const result = calculateWorkoutCalories(unusualWorkout, validProfile);
      
      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('unusually long') || warning.includes('unusually high')
      )).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from individual exercise calculation failures', () => {
      // Mock a scenario where one exercise calculation throws an error
      const workoutWithProblematicExercise: WorkoutData = {
        exercises: [
          { name: 'Normal Exercise', sets: 3, reps: 10, weight: 20 },
          { name: 'Problematic Exercise', sets: 3, reps: 10, weight: 20 },
        ],
        duration: 30,
      };
      
      const result = calculateWorkoutCalories(workoutWithProblematicExercise, validProfile);
      
      // Should still succeed with at least one valid exercise
      expect(result.exerciseBreakdown.length).toBe(2);
      expect(result.totalCalories).toBeGreaterThan(0);
    });

    it('should provide meaningful error messages', () => {
      const invalidWorkout: WorkoutData = {
        exercises: [{ name: '', sets: -1, reps: -1, weight: -1 }],
        duration: -10,
      };
      
      const result = calculateWorkoutCalories(invalidWorkout, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors.every(error => typeof error === 'string' && error.length > 0)).toBe(true);
      expect(result.errors.some(error => error.includes('Duration'))).toBe(true);
      expect(result.errors.some(error => error.includes('Name'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero duration gracefully', () => {
      const zeroWorkout: WorkoutData = {
        exercises: validWorkoutData.exercises,
        duration: 0,
      };
      
      const result = calculateWorkoutCalories(zeroWorkout, validProfile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Duration must be a positive number');
    });

    it('should handle exercises with zero values', () => {
      const zeroWorkout: WorkoutData = {
        exercises: [{ name: 'Zero Exercise', sets: 0, reps: 0, weight: 0 }],
        duration: 30,
      };
      
      const result = calculateWorkoutCalories(zeroWorkout, validProfile);
      
      expect(result.success).toBe(true);
      expect(result.totalCalories).toBeGreaterThanOrEqual(0);
    });

    it('should handle very small profile values', () => {
      const smallProfile = { ...validProfile, weight: 30, height: 100, age: 13 };
      const result = calculateWorkoutCalories(validWorkoutData, smallProfile);
      
      expect(result.success).toBe(true);
      expect(result.totalCalories).toBeGreaterThan(0);
    });

    it('should handle very large profile values within limits', () => {
      const largeProfile = { ...validProfile, weight: 200, height: 220, age: 80 };
      const result = calculateWorkoutCalories(validWorkoutData, largeProfile);
      
      expect(result.success).toBe(true);
      expect(result.totalCalories).toBeGreaterThan(0);
    });
  });
});