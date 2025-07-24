/**
 * Enhanced workout data types with calorie tracking support
 */

import { UserProfile } from '../utils/calorieCalculator';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  // Cardio-specific fields (optional)
  pace?: number; // Speed in mph or kmh
  paceUnit?: 'mph' | 'kmh';
  elevationAngle?: number; // Incline angle in degrees (positive for uphill, negative for downhill)
  intervalTime?: number; // Interval duration in seconds
}

export interface CalorieData {
  totalCalories: number;
  calculationMethod: 'complete_profile' | 'default_values';
  profileSnapshot: Partial<UserProfile>;
  exerciseBreakdown: Array<{
    name: string;
    calories: number;
    intensity: string;
    metValue: number;
  }>;
  averageMET: number;
  profileCompleteness: number;
}

export interface WorkoutRecord {
  id: string;
  date: string;
  exercises: Exercise[];
  duration: number;
  calorieData?: CalorieData;
  notes?: string;
  isMaxWorkout?: boolean; // Flag to indicate if this is a max effort workout
}

export interface MaxRecord {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  sets: number;
  date: string;
  workoutId: string; // Reference to the workout this max came from
}

// Legacy interface for backward compatibility
export interface Workout {
  id: string;
  date: string;
  exercises: Exercise[];
  duration: number;
}