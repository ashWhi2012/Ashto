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
}

// Legacy interface for backward compatibility
export interface Workout {
  id: string;
  date: string;
  exercises: Exercise[];
  duration: number;
}