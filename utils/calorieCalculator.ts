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
  
  // Cardio
  'cardio_light': 4.0,        // Light cardio (walking, light cycling)
  'cardio_moderate': 6.5,     // Moderate cardio (jogging, moderate cycling)
  'cardio_vigorous': 8.5,     // Vigorous cardio (running, intense cycling)
  
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
 * Get MET value for specific exercise with intensity-based adjustments
 */
function getMETValue(exercise: any, intensity: 'light' | 'moderate' | 'vigorous', category: string): number {
  const categoryLower = category.toLowerCase();
  let baseMET: number;
  
  // For cardio exercises, use cardio MET values
  if (categoryLower === 'cardio') {
    baseMET = MET_VALUES[`cardio_${intensity}`] || MET_VALUES.cardio;
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
 * Main function to calculate total calories burned during workout
 */
export function calculateWorkoutCalories(
  workoutData: WorkoutData,
  userProfile: UserProfile,
  exerciseCategories: { [exerciseName: string]: string } = {}
): {
  totalCalories: number;
  exerciseBreakdown: Array<{
    name: string;
    calories: number;
    intensity: string;
    metValue: number;
  }>;
  averageMET: number;
} {
  const { exercises, duration } = workoutData;
  
  if (exercises.length === 0) {
    return {
      totalCalories: 0,
      exerciseBreakdown: [],
      averageMET: 0
    };
  }
  
  // Calculate time per exercise (assuming equal distribution)
  const timePerExercise = duration / exercises.length;
  
  let totalCalories = 0;
  let totalMET = 0;
  const exerciseBreakdown = [];
  
  for (const exercise of exercises) {
    const category = exerciseCategories[exercise.name] || 'default';
    const intensity = determineIntensity(exercise, userProfile.weight);
    const metValue = getMETValue(exercise, intensity, category);
    
    const exerciseCalories = calculateExerciseCalories(
      exercise,
      userProfile,
      category,
      timePerExercise
    );
    
    totalCalories += exerciseCalories;
    totalMET += metValue;
    
    exerciseBreakdown.push({
      name: exercise.name,
      calories: Math.round(exerciseCalories),
      intensity,
      metValue: Math.round(metValue * 10) / 10
    });
  }
  
  const averageMET = totalMET / exercises.length;
  
  return {
    totalCalories: Math.round(totalCalories),
    exerciseBreakdown,
    averageMET: Math.round(averageMET * 10) / 10
  };
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
 */
export function validateHeight(height: number, unit: 'cm' | 'ft_in' = 'cm', inches?: number): ValidationResult {
  const errors: string[] = [];
  
  if (unit === 'ft_in') {
    // Validate feet and inches separately
    if (!Number.isInteger(height) || height < 0) {
      errors.push('Feet must be a non-negative whole number');
    }
    
    if (inches !== undefined && (!Number.isInteger(inches) || inches < 0 || inches >= 12)) {
      errors.push('Inches must be a whole number between 0 and 11');
    }
    
    // Convert to cm for range validation
    const totalInches = height * 12 + (inches || 0);
    const heightInCm = totalInches * 2.54;
    
    if (heightInCm < 100) {
      errors.push('Height must be at least 3 feet 3 inches');
    }
    
    if (heightInCm > 250) {
      errors.push('Height must be 8 feet 2 inches or less');
    }
  } else {
    // Validate centimeters
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
    const heightValidation = validateHeight(profile.height, profile.heightUnit);
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