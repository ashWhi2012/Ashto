/**
 * Calorie Burning Calculator
 * Based on research from:
 * - American College of Sports Medicine (ACSM)
 * - Compendium of Physical Activities
 * - Harris-Benedict Equation for BMR
 * - Mifflin-St Jeor Equation
 */


export interface UserProfile {
  age: number;
  sex: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft_in';
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutData {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  duration: number; // in minutes
}

// MET (Metabolic Equivalent of Task) values for different exercise types
// Based on Compendium of Physical Activities 2011 update
const MET_VALUES = {
  // Strength Training
  'strength_light': 3.5,      // Light effort (bodyweight, light weights)
  'strength_moderate': 5.0,   // Moderate effort (moderate weights)
  'strength_vigorous': 6.0,   // Vigorous effort (heavy weights)
  
  // Cardio - Base values (will be adjusted based on pace, incline, etc.)
  'cardio_light': 4.0,        // Light cardio (walking, light cycling)
  'cardio_moderate': 6.5,     // Moderate cardio (jogging, moderate cycling)
  'cardio_vigorous': 8.5,     // Vigorous cardio (running, intense cycling)
  
  // Cardio-specific activities with pace-based MET values
  'walking': 3.5,             // Base walking MET
  'running': 8.0,             // Base running MET
  'cycling': 6.0,             // Base cycling MET
  'treadmill': 6.0,           // Base treadmill MET
  'elliptical': 5.0,          // Base elliptical MET
  'rowing': 7.0,              // Base rowing MET
  'swimming': 6.0,            // Base swimming MET
  'stairmaster': 9.0,         // Base stair climbing MET
  
  // Default values for common exercise categories
  'arms': 4.5,
  'legs': 5.5,
  'chest': 5.0,
  'back': 5.0,
  'shoulders': 4.5,
  'core': 4.0,
  'cardio': 6.5,
  'default': 4.5
};

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * More accurate than Harris-Benedict for modern populations
 */
export function calculateBMR(profile: UserProfile): number {
  const { age, sex, weight, height } = profile;
  
  if (sex === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };
  
  return bmr * activityMultipliers[profile.activityLevel];
}

/**
 * Determine exercise intensity based on weight used and exercise type
 */
function determineIntensity(exercise: any, userWeight: number): 'light' | 'moderate' | 'vigorous' {
  const { weight, name } = exercise;
  
  // For bodyweight exercises
  if (weight === 0) {
    return 'moderate';
  }
  
  // Calculate weight ratio (exercise weight / body weight)
  const weightRatio = weight / userWeight;
  
  // Intensity thresholds based on research
  if (weightRatio < 0.3) return 'light';
  if (weightRatio < 0.7) return 'moderate';
  return 'vigorous';
}

/**
 * Apply intensity-based MET multipliers
 * Research shows exercise intensity significantly affects metabolic rate
 * - High intensity: 1.2-1.5x base MET for vigorous exercises
 * - Low intensity: 0.8-0.9x base MET for light exercises
 * - Moderate intensity: no adjustment (1.0x base MET)
 */
function applyIntensityMultiplier(baseMET: number, intensity: 'light' | 'moderate' | 'vigorous'): number {
  switch (intensity) {
    case 'light':
      // Apply 0.85x multiplier (middle of 0.8-0.9 range) for light intensity
      return baseMET * 0.85;
    case 'vigorous':
      // Apply 1.35x multiplier (middle of 1.2-1.5 range) for vigorous intensity
      return baseMET * 1.35;
    case 'moderate':
    default:
      // No adjustment for moderate intensity
      return baseMET;
  }
}

/**
 * Calculate pace-based MET value for cardio exercises
 * Based on research from ACSM and Compendium of Physical Activities
 */
function calculatePaceBasedMET(exerciseName: string, pace?: number, paceUnit?: 'mph' | 'kmh'): number {
  if (!pace) return MET_VALUES.cardio; // Default cardio MET if no pace provided
  
  const exerciseNameLower = exerciseName.toLowerCase();
  
  // Convert pace to mph for consistent calculations
  const paceInMph = paceUnit === 'kmh' ? pace * 0.621371 : pace;
  
  // Walking MET calculations (based on ACSM guidelines)
  if (exerciseNameLower.includes('walk') || exerciseNameLower.includes('treadmill')) {
    if (paceInMph < 2.0) return 2.0;
    if (paceInMph < 2.5) return 2.8;
    if (paceInMph < 3.0) return 3.5;
    if (paceInMph < 3.5) return 4.3;
    if (paceInMph < 4.0) return 5.0;
    if (paceInMph < 4.5) return 7.0;
    return 8.5; // Fast walking/jogging
  }
  
  // Running MET calculations
  if (exerciseNameLower.includes('run') || exerciseNameLower.includes('jog')) {
    if (paceInMph < 4.0) return 6.0;
    if (paceInMph < 5.0) return 8.3;
    if (paceInMph < 6.0) return 9.8;
    if (paceInMph < 7.0) return 11.0;
    if (paceInMph < 8.0) return 11.8;
    if (paceInMph < 9.0) return 12.8;
    if (paceInMph < 10.0) return 14.5;
    return 16.0; // Very fast running
  }
  
  // Cycling MET calculations
  if (exerciseNameLower.includes('cycl') || exerciseNameLower.includes('bike')) {
    if (paceInMph < 10.0) return 4.0;
    if (paceInMph < 12.0) return 6.8;
    if (paceInMph < 14.0) return 8.0;
    if (paceInMph < 16.0) return 10.0;
    if (paceInMph < 20.0) return 12.0;
    return 15.8; // Very fast cycling
  }
  
  // Default cardio MET with pace adjustment
  const baseMET = MET_VALUES[exerciseNameLower as keyof typeof MET_VALUES] || MET_VALUES.cardio;
  
  // Apply pace-based multiplier for other cardio exercises
  if (paceInMph < 3.0) return baseMET * 0.7;
  if (paceInMph < 6.0) return baseMET * 1.0;
  if (paceInMph < 9.0) return baseMET * 1.3;
  return baseMET * 1.6;
}

/**
 * Apply elevation/incline adjustments to MET value
 * Based on ACSM guidelines for incline adjustments
 */
function applyElevationAdjustment(baseMET: number, elevationAngle?: number): number {
  if (!elevationAngle || elevationAngle === 0) return baseMET;
  
  // Convert angle to grade percentage: grade = tan(angle in radians) * 100
  const angleInRadians = (elevationAngle * Math.PI) / 180;
  const gradePercent = Math.tan(angleInRadians) * 100;
  
  // ACSM formula adjustment for incline: 
  // Additional MET = 0.1 * grade% for walking/running
  // Cap the adjustment to prevent extreme values
  const maxAdjustment = baseMET * 0.8; // Max 80% increase
  const adjustment = Math.min(Math.abs(gradePercent) * 0.01 * baseMET, maxAdjustment);
  
  if (elevationAngle > 0) {
    // Uphill increases MET
    return baseMET + adjustment;
  } else {
    // Downhill decreases MET (but not below 50% of base)
    return Math.max(baseMET - adjustment * 0.5, baseMET * 0.5);
  }
}

/**
 * Apply interval training adjustments
 * High-intensity intervals increase overall calorie burn
 */
function applyIntervalAdjustment(baseMET: number, intervalTime?: number): number {
  if (!intervalTime) return baseMET;
  
  // Shorter intervals typically mean higher intensity
  // Apply multiplier based on interval duration
  if (intervalTime <= 30) return baseMET * 1.4; // Very short, high-intensity intervals
  if (intervalTime <= 60) return baseMET * 1.3; // Short intervals
  if (intervalTime <= 120) return baseMET * 1.2; // Medium intervals
  if (intervalTime <= 300) return baseMET * 1.1; // Longer intervals
  
  return baseMET; // Very long intervals don't get bonus
}

/**
 * Get MET value for specific exercise with intensity-based adjustments
 * Enhanced for cardio exercises with pace, elevation, and interval support
 */
function getMETValue(exercise: any, intensity: 'light' | 'moderate' | 'vigorous', category: string): number {
  const categoryLower = category.toLowerCase();
  let baseMET: number;
  
  // For cardio exercises, use enhanced cardio calculations
  if (categoryLower === 'cardio') {
    // Use pace-based calculation if pace is provided
    if (exercise.pace) {
      baseMET = calculatePaceBasedMET(exercise.name, exercise.pace, exercise.paceUnit);
    } else {
      // Fall back to intensity-based cardio MET
      baseMET = MET_VALUES[`cardio_${intensity}`] || MET_VALUES.cardio;
    }
    
    // Apply elevation adjustment
    baseMET = applyElevationAdjustment(baseMET, exercise.elevationAngle);
    
    // Apply interval training adjustment
    baseMET = applyIntervalAdjustment(baseMET, exercise.intervalTime);
    
    return baseMET;
  }
  // For strength training, use strength MET values
  else if (MET_VALUES[`strength_${intensity}` as keyof typeof MET_VALUES]) {
    baseMET = MET_VALUES[`strength_${intensity}` as keyof typeof MET_VALUES];
  }
  // Fallback to category-specific or default MET
  else {
    baseMET = MET_VALUES[categoryLower as keyof typeof MET_VALUES] || MET_VALUES.default;
  }
  
  // Apply intensity-based multipliers to the base MET value
  return applyIntensityMultiplier(baseMET, intensity);
}

/**
 * Calculate Body Mass Index (BMI) from height and weight
 */
export function calculateBMI(weight: number, height: number): number {
  // BMI = weight (kg) / height (m)²
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * Apply BMI-based calorie adjustments
 * Research shows metabolic efficiency varies with body composition
 * ±10% adjustment based on BMI ranges
 */
function applyBMIBasedAdjustment(calories: number, bmi: number): number {
  // BMI categories and their metabolic adjustments
  if (bmi < 18.5) {
    // Underweight: +10% (higher metabolic rate to maintain weight)
    return calories * 1.1;
  } else if (bmi >= 18.5 && bmi < 25) {
    // Normal weight: no adjustment
    return calories;
  } else if (bmi >= 25 && bmi < 30) {
    // Overweight: -5% (slightly lower metabolic efficiency)
    return calories * 0.95;
  } else {
    // Obese (BMI >= 30): -10% (lower metabolic efficiency)
    return calories * 0.9;
  }
}

/**
 * Apply sex-based metabolic adjustments to calorie calculations
 * Research shows females typically have 5-10% lower metabolic rates during exercise
 */
function applySexBasedAdjustment(calories: number, sex: 'male' | 'female' | 'other'): number {
  if (sex === 'female') {
    // Apply 7.5% reduction for female users (middle of 5-10% range)
    return calories * 0.925;
  }
  // No adjustment for male or other
  return calories;
}

/**
 * Calculate calories burned for a single exercise
 */
function calculateExerciseCalories(
  exercise: any,
  userProfile: UserProfile,
  exerciseCategory: string,
  durationMinutes: number
): number {
  const intensity = determineIntensity(exercise, userProfile.weight);
  const metValue = getMETValue(exercise, intensity, exerciseCategory);
  
  // Calorie calculation: MET × weight (kg) × time (hours)
  const caloriesPerHour = metValue * userProfile.weight;
  const caloriesForDuration = caloriesPerHour * (durationMinutes / 60);
  
  // Apply sex-based metabolic adjustment
  const sexAdjustedCalories = applySexBasedAdjustment(caloriesForDuration, userProfile.sex);
  
  // Apply BMI-based metabolic adjustment
  const bmi = calculateBMI(userProfile.weight, userProfile.height);
  return applyBMIBasedAdjustment(sexAdjustedCalories, bmi);
}

/**
 * Error types for calorie calculation failures
 */
export enum CalorieCalculationErrorType {
  INVALID_WORKOUT_DATA = 'INVALID_WORKOUT_DATA',
  INVALID_USER_PROFILE = 'INVALID_USER_PROFILE',
  CALCULATION_OVERFLOW = 'CALCULATION_OVERFLOW',
  MISSING_EXERCISE_DATA = 'MISSING_EXERCISE_DATA',
  INVALID_DURATION = 'INVALID_DURATION',
  GENERAL_ERROR = 'GENERAL_ERROR'
}

export class CalorieCalculationError extends Error {
  public readonly type: CalorieCalculationErrorType;
  public readonly details: any;

  constructor(type: CalorieCalculationErrorType, message: string, details?: any) {
    super(message);
    this.name = 'CalorieCalculationError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Result interface for calorie calculations with error handling
 */
export interface CalorieCalculationResult {
  success: boolean;
  totalCalories: number;
  exerciseBreakdown: Array<{
    name: string;
    calories: number;
    intensity: string;
    metValue: number;
    error?: string;
  }>;
  averageMET: number;
  errors: string[];
  warnings: string[];
  fallbacksUsed: string[];
}

/**
 * Validate workout data before calculation
 */
function validateWorkoutData(workoutData: WorkoutData): ValidationResult {
  const errors: string[] = [];

  if (!workoutData) {
    errors.push('Workout data is required');
    return { isValid: false, errors };
  }

  if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) {
    errors.push('Exercises array is required');
  } else if (workoutData.exercises.length === 0) {
    errors.push('At least one exercise is required');
  } else {
    // Validate each exercise
    workoutData.exercises.forEach((exercise, index) => {
      if (!exercise.name || typeof exercise.name !== 'string') {
        errors.push(`Exercise ${index + 1}: Name is required`);
      }
      if (typeof exercise.sets !== 'number' || exercise.sets < 0) {
        errors.push(`Exercise ${index + 1}: Sets must be a non-negative number`);
      }
      if (typeof exercise.reps !== 'number' || exercise.reps < 0) {
        errors.push(`Exercise ${index + 1}: Reps must be a non-negative number`);
      }
      if (typeof exercise.weight !== 'number' || exercise.weight < 0) {
        errors.push(`Exercise ${index + 1}: Weight must be a non-negative number`);
      }
    });
  }

  if (typeof workoutData.duration !== 'number' || workoutData.duration <= 0) {
    errors.push('Duration must be a positive number');
  } else if (workoutData.duration > 1440) { // 24 hours in minutes
    errors.push('Duration cannot exceed 24 hours');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate user profile for calorie calculations
 */
function validateProfileForCalculation(userProfile: UserProfile): ValidationResult {
  const errors: string[] = [];

  if (!userProfile) {
    errors.push('User profile is required');
    return { isValid: false, errors };
  }

  if (typeof userProfile.weight !== 'number' || userProfile.weight <= 0) {
    errors.push('Valid weight is required for calorie calculation');
  } else if (userProfile.weight > 1000) { // Sanity check
    errors.push('Weight value appears to be invalid');
  }

  if (typeof userProfile.age !== 'number' || userProfile.age <= 0) {
    errors.push('Valid age is required for calorie calculation');
  } else if (userProfile.age > 150) { // Sanity check
    errors.push('Age value appears to be invalid');
  }

  if (typeof userProfile.height !== 'number' || userProfile.height <= 0) {
    errors.push('Valid height is required for calorie calculation');
  } else if (userProfile.height > 300) { // Sanity check
    errors.push('Height value appears to be invalid');
  }

  if (!userProfile.sex || !['male', 'female', 'other'].includes(userProfile.sex)) {
    errors.push('Valid sex is required for calorie calculation');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Safe math operations to prevent overflow
 */
function safeMultiply(a: number, b: number, maxResult: number = 100000): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new CalorieCalculationError(
      CalorieCalculationErrorType.CALCULATION_OVERFLOW,
      'Invalid numbers in calculation'
    );
  }

  const result = a * b;
  
  if (!Number.isFinite(result) || result > maxResult) {
    throw new CalorieCalculationError(
      CalorieCalculationErrorType.CALCULATION_OVERFLOW,
      'Calculation result exceeds safe limits'
    );
  }

  return result;
}

/**
 * Calculate calories for a single exercise with error handling
 */
function calculateExerciseCaloriesSafe(
  exercise: any,
  userProfile: UserProfile,
  exerciseCategory: string,
  durationMinutes: number
): { calories: number; error?: string; warnings: string[] } {
  const warnings: string[] = [];
  
  try {
    // Validate inputs
    if (durationMinutes <= 0) {
      return { 
        calories: 0, 
        error: 'Invalid duration', 
        warnings: ['Duration must be positive'] 
      };
    }

    if (durationMinutes > 480) { // 8 hours
      warnings.push('Exercise duration is unusually long');
    }

    const intensity = determineIntensity(exercise, userProfile.weight);
    const metValue = getMETValue(exercise, intensity, exerciseCategory);
    
    // Safe calorie calculation with bounds checking
    const caloriesPerHour = safeMultiply(metValue, userProfile.weight, 10000);
    const caloriesForDuration = safeMultiply(caloriesPerHour, durationMinutes / 60, 50000);
    
    // Apply adjustments with bounds checking
    const sexAdjustedCalories = applySexBasedAdjustment(caloriesForDuration, userProfile.sex);
    
    const bmi = calculateBMI(userProfile.weight, userProfile.height);
    const finalCalories = applyBMIBasedAdjustment(sexAdjustedCalories, bmi);
    
    // Sanity check on final result
    if (finalCalories > 5000) { // Very high calorie burn per exercise
      warnings.push('Unusually high calorie burn calculated');
    }
    
    return { 
      calories: Math.max(0, finalCalories), 
      warnings 
    };
    
  } catch (error) {
    if (error instanceof CalorieCalculationError) {
      return { 
        calories: 0, 
        error: error.message, 
        warnings: ['Fallback to 0 calories due to calculation error'] 
      };
    }
    
    return { 
      calories: 0, 
      error: 'Unknown calculation error', 
      warnings: ['Unexpected error during calculation'] 
    };
  }
}

/**
 * Main function to calculate total calories burned during workout with comprehensive error handling
 */
export function calculateWorkoutCalories(
  workoutData: WorkoutData,
  userProfile: UserProfile,
  exerciseCategories: { [exerciseName: string]: string } = {}
): CalorieCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fallbacksUsed: string[] = [];
  
  try {
    // Validate inputs
    const workoutValidation = validateWorkoutData(workoutData);
    if (!workoutValidation.isValid) {
      return {
        success: false,
        totalCalories: 0,
        exerciseBreakdown: [],
        averageMET: 0,
        errors: workoutValidation.errors,
        warnings,
        fallbacksUsed
      };
    }

    const profileValidation = validateProfileForCalculation(userProfile);
    if (!profileValidation.isValid) {
      return {
        success: false,
        totalCalories: 0,
        exerciseBreakdown: [],
        averageMET: 0,
        errors: profileValidation.errors,
        warnings,
        fallbacksUsed
      };
    }

    const { exercises, duration } = workoutData;
    
    if (exercises.length === 0) {
      return {
        success: true,
        totalCalories: 0,
        exerciseBreakdown: [],
        averageMET: 0,
        errors,
        warnings: ['No exercises provided'],
        fallbacksUsed
      };
    }
    
    // Calculate time per exercise (assuming equal distribution)
    const timePerExercise = duration / exercises.length;
    
    let totalCalories = 0;
    let totalMET = 0;
    let successfulCalculations = 0;
    const exerciseBreakdown = [];
    
    for (const exercise of exercises) {
      try {
        const category = exerciseCategories[exercise.name] || 'default';
        
        // Use fallback category if not found
        if (!exerciseCategories[exercise.name]) {
          fallbacksUsed.push(`Used default category for ${exercise.name}`);
        }
        
        const intensity = determineIntensity(exercise, userProfile.weight);
        const metValue = getMETValue(exercise, intensity, category);
        
        const exerciseResult = calculateExerciseCaloriesSafe(
          exercise,
          userProfile,
          category,
          timePerExercise
        );
        
        // Collect warnings from individual exercise calculations
        warnings.push(...exerciseResult.warnings);
        
        if (exerciseResult.error) {
          errors.push(`${exercise.name}: ${exerciseResult.error}`);
          exerciseBreakdown.push({
            name: exercise.name,
            calories: 0,
            intensity,
            metValue: Math.round(metValue * 10) / 10,
            error: exerciseResult.error
          });
        } else {
          totalCalories += exerciseResult.calories;
          totalMET += metValue;
          successfulCalculations++;
          
          exerciseBreakdown.push({
            name: exercise.name,
            calories: Math.round(exerciseResult.calories),
            intensity,
            metValue: Math.round(metValue * 10) / 10
          });
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${exercise.name}: ${errorMessage}`);
        
        exerciseBreakdown.push({
          name: exercise.name,
          calories: 0,
          intensity: 'unknown',
          metValue: 0,
          error: errorMessage
        });
      }
    }
    
    // Calculate average MET only from successful calculations
    const averageMET = successfulCalculations > 0 ? totalMET / successfulCalculations : 0;
    
    // Final validation of total calories
    if (totalCalories > 10000) { // Sanity check for total workout calories
      warnings.push('Total calorie burn is unusually high - please verify your profile data');
    }
    
    const success = errors.length === 0 || successfulCalculations > 0;
    
    return {
      success,
      totalCalories: Math.round(Math.max(0, totalCalories)),
      exerciseBreakdown,
      averageMET: Math.round(averageMET * 10) / 10,
      errors,
      warnings,
      fallbacksUsed
    };
    
  } catch (error) {
    // Catch-all error handler
    const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
    
    return {
      success: false,
      totalCalories: 0,
      exerciseBreakdown: [],
      averageMET: 0,
      errors: [errorMessage],
      warnings,
      fallbacksUsed
    };
  }
}

/**
 * Get calorie burn rate per minute for real-time tracking
 */
export function getCalorieRatePerMinute(
  exercises: any[],
  userProfile: UserProfile,
  exerciseCategories: { [exerciseName: string]: string } = {}
): number {
  if (exercises.length === 0) return 0;
  
  let totalMET = 0;
  
  for (const exercise of exercises) {
    const category = exerciseCategories[exercise.name] || 'default';
    const intensity = determineIntensity(exercise, userProfile.weight);
    const metValue = getMETValue(exercise, intensity, category);
    totalMET += metValue;
  }
  
  const averageMET = totalMET / exercises.length;
  const caloriesPerMinute = (averageMET * userProfile.weight) / 60;
  
  // Apply sex-based metabolic adjustment
  const sexAdjustedCaloriesPerMinute = applySexBasedAdjustment(caloriesPerMinute, userProfile.sex);
  
  // Apply BMI-based metabolic adjustment
  const bmi = calculateBMI(userProfile.weight, userProfile.height);
  const finalAdjustedCaloriesPerMinute = applyBMIBasedAdjustment(sexAdjustedCaloriesPerMinute, bmi);
  
  return Math.round(finalAdjustedCaloriesPerMinute * 10) / 10;
}

/**
 * Convert weight from pounds to kilograms
 */
export function lbsToKg(pounds: number): number {
  return pounds * 0.453592;
}

/**
 * Convert weight from kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

/**
 * Convert height from feet/inches to centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

/**
 * Convert height from centimeters to feet and inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate age (13-120 years)
 */
export function validateAge(age: number): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(age)) {
    errors.push('Age must be a whole number');
  }
  
  if (age < 13) {
    errors.push('Age must be at least 13 years');
  }
  
  if (age > 120) {
    errors.push('Age must be 120 years or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate weight (30-300kg)
 */
export function validateWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isFinite(weight) || weight <= 0) {
    errors.push('Weight must be a positive number');
  }
  
  // Convert to kg for validation if needed
  const weightInKg = unit === 'lbs' ? lbsToKg(weight) : weight;
  
  if (weightInKg < 30) {
    errors.push(`Weight must be at least ${unit === 'lbs' ? '66' : '30'} ${unit}`);
  }
  
  if (weightInKg > 300) {
    errors.push(`Weight must be ${unit === 'lbs' ? '661' : '300'} ${unit} or less`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate height (100-250cm)
 * Note: Height is always stored in cm in UserProfile, regardless of display unit
 */
export function validateHeight(height: number, unit: 'cm' | 'ft_in' = 'cm', inches?: number): ValidationResult {
  const errors: string[] = [];
  
  if (unit === 'ft_in' && inches !== undefined) {
    // This is for form validation where feet and inches are provided separately
    if (!Number.isInteger(height) || height < 0) {
      errors.push('Feet must be a non-negative whole number');
    }
    
    if (!Number.isInteger(inches) || inches < 0 || inches >= 12) {
      errors.push('Inches must be a whole number between 0 and 11');
    }
    
    // Convert to cm for range validation
    const totalInches = height * 12 + inches;
    const heightInCm = totalInches * 2.54;
    
    if (heightInCm < 100) {
      errors.push('Height must be at least 3 feet 3 inches');
    }
    
    if (heightInCm > 250) {
      errors.push('Height must be 8 feet 2 inches or less');
    }
  } else {
    // For profile validation, height is always in cm regardless of heightUnit
    if (!Number.isFinite(height) || height <= 0) {
      errors.push('Height must be a positive number');
    }
    
    if (height < 100) {
      errors.push('Height must be at least 100 cm');
    }
    
    if (height > 250) {
      errors.push('Height must be 250 cm or less');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate sex selection
 */
export function validateSex(sex: string): ValidationResult {
  const validOptions = ['male', 'female', 'other'];
  const errors: string[] = [];
  
  if (!validOptions.includes(sex)) {
    errors.push('Sex must be male, female, or other');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate complete user profile
 */
export function validateUserProfile(profile: Partial<UserProfile>): ValidationResult {
  const errors: string[] = [];
  
  // Validate age
  if (profile.age !== undefined) {
    const ageValidation = validateAge(profile.age);
    errors.push(...ageValidation.errors);
  } else {
    errors.push('Age is required');
  }
  
  // Validate sex
  if (profile.sex !== undefined) {
    const sexValidation = validateSex(profile.sex);
    errors.push(...sexValidation.errors);
  } else {
    errors.push('Sex is required');
  }
  
  // Validate weight
  if (profile.weight !== undefined) {
    const weightValidation = validateWeight(profile.weight, profile.weightUnit);
    errors.push(...weightValidation.errors);
  } else {
    errors.push('Weight is required');
  }
  
  // Validate height
  if (profile.height !== undefined) {
    // Height is always stored in cm in UserProfile, so validate as cm regardless of heightUnit
    const heightValidation = validateHeight(profile.height, 'cm');
    errors.push(...heightValidation.errors);
  } else {
    errors.push('Height is required');
  }
  
  // Validate units
  if (profile.weightUnit && !['kg', 'lbs'].includes(profile.weightUnit)) {
    errors.push('Weight unit must be kg or lbs');
  }
  
  if (profile.heightUnit && !['cm', 'ft_in'].includes(profile.heightUnit)) {
    errors.push('Height unit must be cm or ft_in');
  }
  
  // Validate activity level
  const validActivityLevels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'];
  if (profile.activityLevel && !validActivityLevels.includes(profile.activityLevel)) {
    errors.push('Invalid activity level');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get fitness recommendations based on user profile
 */
export function getFitnessRecommendations(profile: UserProfile): {
  dailyCalorieGoal: number;
  recommendedWorkoutCalories: number;
  weeklyWorkoutMinutes: number;
} {
  const tdee = calculateTDEE(profile);
  
  // General recommendations based on health guidelines
  const recommendedWorkoutCalories = Math.round(tdee * 0.15); // 15% of TDEE through exercise
  const weeklyWorkoutMinutes = 150; // WHO recommendation for moderate activity
  
  return {
    dailyCalorieGoal: Math.round(tdee),
    recommendedWorkoutCalories,
    weeklyWorkoutMinutes
  };
}