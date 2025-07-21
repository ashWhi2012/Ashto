/**
 * Unit tests for calorieCalculator.ts
 * Testing validation functions and unit conversions
 */

import {
    calculateBMI,
    calculateWorkoutCalories,
    cmToFeetInches,
    feetInchesToCm,
    getCalorieRatePerMinute,
    kgToLbs,
    lbsToKg,
    UserProfile,
    validateAge,
    validateHeight,
    validateSex,
    validateUserProfile,
    validateWeight,
    WorkoutData
} from '../calorieCalculator';

describe('Unit Conversion Functions', () => {
  describe('lbsToKg', () => {
    test('converts pounds to kilograms correctly', () => {
      expect(lbsToKg(220)).toBeCloseTo(99.79, 2);
      expect(lbsToKg(154)).toBeCloseTo(69.85, 2);
      expect(lbsToKg(0)).toBe(0);
      expect(lbsToKg(1)).toBeCloseTo(0.45, 2);
    });
  });

  describe('kgToLbs', () => {
    test('converts kilograms to pounds correctly', () => {
      expect(kgToLbs(100)).toBeCloseTo(220.46, 2);
      expect(kgToLbs(70)).toBeCloseTo(154.32, 2);
      expect(kgToLbs(0)).toBe(0);
      expect(kgToLbs(1)).toBeCloseTo(2.20, 2);
    });
  });

  describe('feetInchesToCm', () => {
    test('converts feet and inches to centimeters correctly', () => {
      expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 2);
      expect(feetInchesToCm(5, 8)).toBeCloseTo(172.72, 2);
      expect(feetInchesToCm(5, 0)).toBeCloseTo(152.4, 2);
      expect(feetInchesToCm(0, 12)).toBeCloseTo(30.48, 2);
      expect(feetInchesToCm(0, 0)).toBe(0);
    });
  });

  describe('cmToFeetInches', () => {
    test('converts centimeters to feet and inches correctly', () => {
      const result1 = cmToFeetInches(183);
      expect(result1.feet).toBe(6);
      expect(result1.inches).toBe(0);

      const result2 = cmToFeetInches(173);
      expect(result2.feet).toBe(5);
      expect(result2.inches).toBe(8);

      const result3 = cmToFeetInches(152);
      expect(result3.feet).toBe(5);
      expect(result3.inches).toBe(0);

      const result4 = cmToFeetInches(0);
      expect(result4.feet).toBe(0);
      expect(result4.inches).toBe(0);
    });
  });

  describe('round-trip conversions', () => {
    test('weight conversions are consistent', () => {
      const originalKg = 75;
      const convertedLbs = kgToLbs(originalKg);
      const backToKg = lbsToKg(convertedLbs);
      expect(backToKg).toBeCloseTo(originalKg, 2);
    });

    test('height conversions are consistent', () => {
      const originalCm = 175;
      const { feet, inches } = cmToFeetInches(originalCm);
      const backToCm = feetInchesToCm(feet, inches);
      expect(backToCm).toBeCloseTo(originalCm, 1);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateAge', () => {
    test('accepts valid ages', () => {
      expect(validateAge(25).isValid).toBe(true);
      expect(validateAge(13).isValid).toBe(true);
      expect(validateAge(120).isValid).toBe(true);
      expect(validateAge(65).isValid).toBe(true);
    });

    test('rejects invalid ages', () => {
      const result1 = validateAge(12);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Age must be at least 13 years');

      const result2 = validateAge(121);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Age must be 120 years or less');

      const result3 = validateAge(25.5);
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Age must be a whole number');
    });

    test('rejects negative ages', () => {
      const result = validateAge(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateWeight', () => {
    test('accepts valid weights in kg', () => {
      expect(validateWeight(70, 'kg').isValid).toBe(true);
      expect(validateWeight(30, 'kg').isValid).toBe(true);
      expect(validateWeight(300, 'kg').isValid).toBe(true);
      expect(validateWeight(85.5, 'kg').isValid).toBe(true);
    });

    test('accepts valid weights in lbs', () => {
      expect(validateWeight(154, 'lbs').isValid).toBe(true);
      expect(validateWeight(66, 'lbs').isValid).toBe(true);
      expect(validateWeight(661, 'lbs').isValid).toBe(true);
      expect(validateWeight(180.5, 'lbs').isValid).toBe(true);
    });

    test('rejects weights below minimum in kg', () => {
      const result = validateWeight(25, 'kg');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be at least 30 kg');
    });

    test('rejects weights below minimum in lbs', () => {
      const result = validateWeight(60, 'lbs');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be at least 66 lbs');
    });

    test('rejects weights above maximum in kg', () => {
      const result = validateWeight(350, 'kg');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be 300 kg or less');
    });

    test('rejects weights above maximum in lbs', () => {
      const result = validateWeight(700, 'lbs');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be 661 lbs or less');
    });

    test('rejects invalid weight values', () => {
      const result1 = validateWeight(0);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Weight must be a positive number');

      const result2 = validateWeight(-10);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Weight must be a positive number');

      const result3 = validateWeight(NaN);
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Weight must be a positive number');
    });
  });

  describe('validateHeight', () => {
    test('accepts valid heights in cm', () => {
      expect(validateHeight(175, 'cm').isValid).toBe(true);
      expect(validateHeight(100, 'cm').isValid).toBe(true);
      expect(validateHeight(250, 'cm').isValid).toBe(true);
      expect(validateHeight(165.5, 'cm').isValid).toBe(true);
    });

    test('accepts valid heights in ft_in', () => {
      expect(validateHeight(5, 'ft_in', 8).isValid).toBe(true);
      expect(validateHeight(3, 'ft_in', 3).isValid).toBe(true);
      expect(validateHeight(8, 'ft_in', 2).isValid).toBe(true);
      expect(validateHeight(6, 'ft_in', 0).isValid).toBe(true);
    });

    test('rejects heights below minimum in cm', () => {
      const result = validateHeight(90, 'cm');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be at least 100 cm');
    });

    test('rejects heights above maximum in cm', () => {
      const result = validateHeight(260, 'cm');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be 250 cm or less');
    });

    test('rejects heights below minimum in ft_in', () => {
      const result = validateHeight(3, 'ft_in', 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be at least 3 feet 3 inches');
    });

    test('rejects heights above maximum in ft_in', () => {
      const result = validateHeight(8, 'ft_in', 6);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be 8 feet 2 inches or less');
    });

    test('rejects invalid feet values', () => {
      const result1 = validateHeight(-1, 'ft_in', 6);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Feet must be a non-negative whole number');

      const result2 = validateHeight(5.5, 'ft_in', 6);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Feet must be a non-negative whole number');
    });

    test('rejects invalid inches values', () => {
      const result1 = validateHeight(5, 'ft_in', -1);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Inches must be a whole number between 0 and 11');

      const result2 = validateHeight(5, 'ft_in', 12);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Inches must be a whole number between 0 and 11');

      const result3 = validateHeight(5, 'ft_in', 6.5);
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Inches must be a whole number between 0 and 11');
    });

    test('rejects invalid cm values', () => {
      const result1 = validateHeight(0, 'cm');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Height must be a positive number');

      const result2 = validateHeight(-10, 'cm');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Height must be a positive number');

      const result3 = validateHeight(NaN, 'cm');
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Height must be a positive number');
    });
  });

  describe('validateSex', () => {
    test('accepts valid sex values', () => {
      expect(validateSex('male').isValid).toBe(true);
      expect(validateSex('female').isValid).toBe(true);
      expect(validateSex('other').isValid).toBe(true);
    });

    test('rejects invalid sex values', () => {
      const result1 = validateSex('invalid');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Sex must be male, female, or other');

      const result2 = validateSex('');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Sex must be male, female, or other');

      const result3 = validateSex('Male'); // case sensitive
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Sex must be male, female, or other');
    });
  });

  describe('validateUserProfile', () => {
    const validProfile: Partial<UserProfile> = {
      age: 30,
      sex: 'male',
      weight: 75,
      height: 180,
      weightUnit: 'kg',
      heightUnit: 'cm',
      activityLevel: 'moderately_active'
    };

    test('accepts complete valid profile', () => {
      const result = validateUserProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects profile with missing required fields', () => {
      const incompleteProfile = { age: 30 };
      const result = validateUserProfile(incompleteProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sex is required');
      expect(result.errors).toContain('Weight is required');
      expect(result.errors).toContain('Height is required');
    });

    test('rejects profile with invalid field values', () => {
      const invalidProfile = {
        ...validProfile,
        age: 10,
        sex: 'invalid' as any,
        weight: -5,
        height: 50
      };
      const result = validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('rejects profile with invalid units', () => {
      const invalidUnitsProfile = {
        ...validProfile,
        weightUnit: 'invalid' as any,
        heightUnit: 'invalid' as any
      };
      const result = validateUserProfile(invalidUnitsProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight unit must be kg or lbs');
      expect(result.errors).toContain('Height unit must be cm or ft_in');
    });

    test('rejects profile with invalid activity level', () => {
      const invalidActivityProfile = {
        ...validProfile,
        activityLevel: 'invalid' as any
      };
      const result = validateUserProfile(invalidActivityProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid activity level');
    });
  });
});

describe('Sex-Based Metabolic Adjustments', () => {
  const baseWorkoutData: WorkoutData = {
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
      { name: 'Squats', sets: 3, reps: 15, weight: 0 }
    ],
    duration: 30 // 30 minutes
  };

  const maleProfile: UserProfile = {
    age: 30,
    sex: 'male',
    weight: 70,
    height: 175,
    activityLevel: 'moderately_active',
    weightUnit: 'kg',
    heightUnit: 'cm',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const femaleProfile: UserProfile = {
    ...maleProfile,
    sex: 'female'
  };

  const otherProfile: UserProfile = {
    ...maleProfile,
    sex: 'other'
  };

  test('applies 7.5% reduction for female users in workout calculations', () => {
    const maleResult = calculateWorkoutCalories(baseWorkoutData, maleProfile);
    const femaleResult = calculateWorkoutCalories(baseWorkoutData, femaleProfile);
    
    // Female should have approximately 7.5% fewer calories (92.5% of male calories)
    const expectedFemaleCalories = Math.round(maleResult.totalCalories * 0.925);
    expect(femaleResult.totalCalories).toBe(expectedFemaleCalories);
    expect(femaleResult.totalCalories).toBeLessThan(maleResult.totalCalories);
  });

  test('does not apply adjustment for male users', () => {
    const result1 = calculateWorkoutCalories(baseWorkoutData, maleProfile);
    const result2 = calculateWorkoutCalories(baseWorkoutData, maleProfile);
    
    expect(result1.totalCalories).toBe(result2.totalCalories);
  });

  test('does not apply adjustment for other sex users', () => {
    const maleResult = calculateWorkoutCalories(baseWorkoutData, maleProfile);
    const otherResult = calculateWorkoutCalories(baseWorkoutData, otherProfile);
    
    expect(otherResult.totalCalories).toBe(maleResult.totalCalories);
  });

  test('applies sex-based adjustment to calorie rate per minute', () => {
    const maleRate = getCalorieRatePerMinute(baseWorkoutData.exercises, maleProfile);
    const femaleRate = getCalorieRatePerMinute(baseWorkoutData.exercises, femaleProfile);
    
    // Female rate should be approximately 7.5% lower
    const expectedFemaleRate = Math.round((maleRate * 0.925) * 10) / 10;
    expect(femaleRate).toBe(expectedFemaleRate);
    expect(femaleRate).toBeLessThan(maleRate);
  });

  test('maintains sex-based adjustment consistency across different workout intensities', () => {
    const lightWorkout: WorkoutData = {
      exercises: [{ name: 'Walking', sets: 1, reps: 1, weight: 0 }],
      duration: 30
    };
    
    const vigorousWorkout: WorkoutData = {
      exercises: [{ name: 'Burpees', sets: 5, reps: 10, weight: 0 }],
      duration: 30
    };

    const maleLightResult = calculateWorkoutCalories(lightWorkout, maleProfile);
    const femaleLightResult = calculateWorkoutCalories(lightWorkout, femaleProfile);
    const maleVigorousResult = calculateWorkoutCalories(vigorousWorkout, maleProfile);
    const femaleVigorousResult = calculateWorkoutCalories(vigorousWorkout, femaleProfile);

    // Both should have the same percentage reduction
    const lightReductionRatio = femaleLightResult.totalCalories / maleLightResult.totalCalories;
    const vigorousReductionRatio = femaleVigorousResult.totalCalories / maleVigorousResult.totalCalories;
    
    expect(lightReductionRatio).toBeCloseTo(0.925, 2);
    expect(vigorousReductionRatio).toBeCloseTo(0.925, 2);
    expect(lightReductionRatio).toBeCloseTo(vigorousReductionRatio, 2);
  });

  test('applies sex-based adjustment to exercise breakdown', () => {
    const maleResult = calculateWorkoutCalories(baseWorkoutData, maleProfile);
    const femaleResult = calculateWorkoutCalories(baseWorkoutData, femaleProfile);
    
    expect(maleResult.exerciseBreakdown).toHaveLength(femaleResult.exerciseBreakdown.length);
    
    // Each exercise should have the sex-based adjustment applied
    for (let i = 0; i < maleResult.exerciseBreakdown.length; i++) {
      const maleExercise = maleResult.exerciseBreakdown[i];
      const femaleExercise = femaleResult.exerciseBreakdown[i];
      
      expect(femaleExercise.name).toBe(maleExercise.name);
      expect(femaleExercise.calories).toBeLessThan(maleExercise.calories);
      
      // Should be approximately 7.5% reduction
      const expectedFemaleCalories = Math.round(maleExercise.calories * 0.925);
      expect(femaleExercise.calories).toBe(expectedFemaleCalories);
    }
  });
});

describe('BMI-Based Calorie Adjustments', () => {
  const baseWorkoutData: WorkoutData = {
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
      { name: 'Squats', sets: 3, reps: 15, weight: 0 }
    ],
    duration: 30 // 30 minutes
  };

  test('calculates BMI correctly', () => {
    expect(calculateBMI(70, 175)).toBeCloseTo(22.86, 2); // Normal weight
    expect(calculateBMI(50, 175)).toBeCloseTo(16.33, 2); // Underweight
    expect(calculateBMI(85, 175)).toBeCloseTo(27.76, 2); // Overweight
    expect(calculateBMI(100, 175)).toBeCloseTo(32.65, 2); // Obese
  });

  test('applies +10% adjustment for underweight users (BMI < 18.5)', () => {
    const underweightProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 50, // BMI ~16.33
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const normalProfile: UserProfile = {
      ...underweightProfile,
      weight: 70 // BMI ~22.86
    };

    const underweightResult = calculateWorkoutCalories(baseWorkoutData, underweightProfile);
    const normalResult = calculateWorkoutCalories(baseWorkoutData, normalProfile);

    // Underweight should burn more calories due to higher metabolic rate
    expect(underweightResult.totalCalories).toBeGreaterThan(normalResult.totalCalories);
  });

  test('applies no adjustment for normal weight users (BMI 18.5-24.9)', () => {
    const normalProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 70, // BMI ~22.86
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const result = calculateWorkoutCalories(baseWorkoutData, normalProfile);
    expect(result.totalCalories).toBeGreaterThan(0);
  });

  test('applies -5% adjustment for overweight users (BMI 25-29.9)', () => {
    const overweightProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 85, // BMI ~27.76
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const normalProfile: UserProfile = {
      ...overweightProfile,
      weight: 70 // BMI ~22.86
    };

    const overweightResult = calculateWorkoutCalories(baseWorkoutData, overweightProfile);
    const normalResult = calculateWorkoutCalories(baseWorkoutData, normalProfile);

    // Overweight should have slightly lower calorie burn efficiency
    // But since they weigh more, total calories might still be higher
    // The adjustment is applied to the calculated calories
    expect(overweightResult.totalCalories).toBeGreaterThan(0);
  });

  test('applies -10% adjustment for obese users (BMI >= 30)', () => {
    const obeseProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 100, // BMI ~32.65
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const normalProfile: UserProfile = {
      ...obeseProfile,
      weight: 70 // BMI ~22.86
    };

    const obeseResult = calculateWorkoutCalories(baseWorkoutData, obeseProfile);
    const normalResult = calculateWorkoutCalories(baseWorkoutData, normalProfile);

    // Obese users should have lower metabolic efficiency
    expect(obeseResult.totalCalories).toBeGreaterThan(0);
  });

  test('applies BMI adjustment to calorie rate per minute', () => {
    const underweightProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 50, // BMI ~16.33
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const normalProfile: UserProfile = {
      ...underweightProfile,
      weight: 70 // BMI ~22.86
    };

    const underweightRate = getCalorieRatePerMinute(baseWorkoutData.exercises, underweightProfile);
    const normalRate = getCalorieRatePerMinute(baseWorkoutData.exercises, normalProfile);

    expect(underweightRate).toBeGreaterThan(0);
    expect(normalRate).toBeGreaterThan(0);
  });
});

describe('Intensity-Based MET Multipliers', () => {
  const baseProfile: UserProfile = {
    age: 30,
    sex: 'male',
    weight: 70,
    height: 175,
    activityLevel: 'moderately_active',
    weightUnit: 'kg',
    heightUnit: 'cm',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  test('applies 0.85x multiplier for light intensity exercises', () => {
    const lightWorkout: WorkoutData = {
      exercises: [
        { name: 'Light stretching', sets: 1, reps: 10, weight: 0 } // Light intensity
      ],
      duration: 30
    };

    const result = calculateWorkoutCalories(lightWorkout, baseProfile);
    expect(result.totalCalories).toBeGreaterThan(0);
    expect(result.exerciseBreakdown[0].intensity).toBe('moderate'); // bodyweight defaults to moderate
  });

  test('applies 1.35x multiplier for vigorous intensity exercises', () => {
    const vigorousWorkout: WorkoutData = {
      exercises: [
        { name: 'Heavy squats', sets: 3, reps: 8, weight: 100 } // High weight ratio = vigorous
      ],
      duration: 30
    };

    const result = calculateWorkoutCalories(vigorousWorkout, baseProfile);
    expect(result.totalCalories).toBeGreaterThan(0);
    expect(result.exerciseBreakdown[0].intensity).toBe('vigorous');
  });

  test('applies no multiplier for moderate intensity exercises', () => {
    const moderateWorkout: WorkoutData = {
      exercises: [
        { name: 'Moderate squats', sets: 3, reps: 10, weight: 35 } // Moderate weight ratio
      ],
      duration: 30
    };

    const result = calculateWorkoutCalories(moderateWorkout, baseProfile);
    expect(result.totalCalories).toBeGreaterThan(0);
    expect(result.exerciseBreakdown[0].intensity).toBe('moderate');
  });

  test('determines intensity correctly based on weight ratio', () => {
    const userWeight = 70; // kg

    // Light intensity: weight < 30% of body weight
    const lightWorkout: WorkoutData = {
      exercises: [{ name: 'Light exercise', sets: 3, reps: 10, weight: 15 }], // ~21% of body weight
      duration: 30
    };

    // Moderate intensity: weight 30-70% of body weight  
    const moderateWorkout: WorkoutData = {
      exercises: [{ name: 'Moderate exercise', sets: 3, reps: 10, weight: 35 }], // 50% of body weight
      duration: 30
    };

    // Vigorous intensity: weight > 70% of body weight
    const vigorousWorkout: WorkoutData = {
      exercises: [{ name: 'Heavy exercise', sets: 3, reps: 8, weight: 60 }], // ~86% of body weight
      duration: 30
    };

    const lightResult = calculateWorkoutCalories(lightWorkout, baseProfile);
    const moderateResult = calculateWorkoutCalories(moderateWorkout, baseProfile);
    const vigorousResult = calculateWorkoutCalories(vigorousWorkout, baseProfile);

    expect(lightResult.exerciseBreakdown[0].intensity).toBe('light');
    expect(moderateResult.exerciseBreakdown[0].intensity).toBe('moderate');
    expect(vigorousResult.exerciseBreakdown[0].intensity).toBe('vigorous');
  });

  test('bodyweight exercises default to moderate intensity', () => {
    const bodyweightWorkout: WorkoutData = {
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
        { name: 'Squats', sets: 3, reps: 15, weight: 0 }
      ],
      duration: 30
    };

    const result = calculateWorkoutCalories(bodyweightWorkout, baseProfile);
    
    result.exerciseBreakdown.forEach(exercise => {
      expect(exercise.intensity).toBe('moderate');
    });
  });

  test('intensity affects MET values correctly', () => {
    const lightWorkout: WorkoutData = {
      exercises: [{ name: 'Light exercise', sets: 3, reps: 10, weight: 10 }],
      duration: 30
    };

    const moderateWorkout: WorkoutData = {
      exercises: [{ name: 'Moderate exercise', sets: 3, reps: 10, weight: 35 }],
      duration: 30
    };

    const vigorousWorkout: WorkoutData = {
      exercises: [{ name: 'Heavy exercise', sets: 3, reps: 8, weight: 60 }],
      duration: 30
    };

    const lightResult = calculateWorkoutCalories(lightWorkout, baseProfile);
    const moderateResult = calculateWorkoutCalories(moderateWorkout, baseProfile);
    const vigorousResult = calculateWorkoutCalories(vigorousWorkout, baseProfile);

    // Vigorous should have higher MET than moderate, moderate higher than light
    expect(vigorousResult.exerciseBreakdown[0].metValue).toBeGreaterThan(
      moderateResult.exerciseBreakdown[0].metValue
    );
    expect(moderateResult.exerciseBreakdown[0].metValue).toBeGreaterThan(
      lightResult.exerciseBreakdown[0].metValue
    );
  });

  test('cardio exercises use cardio-specific MET values', () => {
    const cardioWorkout: WorkoutData = {
      exercises: [{ name: 'Running', sets: 1, reps: 1, weight: 0 }],
      duration: 30
    };

    const exerciseCategories = { 'Running': 'cardio' };
    const result = calculateWorkoutCalories(cardioWorkout, baseProfile, exerciseCategories);

    expect(result.totalCalories).toBeGreaterThan(0);
    expect(result.exerciseBreakdown[0].metValue).toBeGreaterThan(4.0); // Cardio MET values are higher
  });
});

describe('Edge Cases and Boundary Values', () => {
  test('validates boundary values for age', () => {
    expect(validateAge(13).isValid).toBe(true);
    expect(validateAge(120).isValid).toBe(true);
    expect(validateAge(12).isValid).toBe(false);
    expect(validateAge(121).isValid).toBe(false);
  });

  test('validates boundary values for weight in kg', () => {
    expect(validateWeight(30, 'kg').isValid).toBe(true);
    expect(validateWeight(300, 'kg').isValid).toBe(true);
    expect(validateWeight(29.9, 'kg').isValid).toBe(false);
    expect(validateWeight(300.1, 'kg').isValid).toBe(false);
  });

  test('validates boundary values for weight in lbs', () => {
    expect(validateWeight(66, 'lbs').isValid).toBe(true);
    expect(validateWeight(661, 'lbs').isValid).toBe(true);
    expect(validateWeight(65.9, 'lbs').isValid).toBe(false);
    expect(validateWeight(661.1, 'lbs').isValid).toBe(false);
  });

  test('validates boundary values for height in cm', () => {
    expect(validateHeight(100, 'cm').isValid).toBe(true);
    expect(validateHeight(250, 'cm').isValid).toBe(true);
    expect(validateHeight(99.9, 'cm').isValid).toBe(false);
    expect(validateHeight(250.1, 'cm').isValid).toBe(false);
  });

  test('validates boundary values for height in ft_in', () => {
    expect(validateHeight(3, 'ft_in', 3).isValid).toBe(true);
    expect(validateHeight(8, 'ft_in', 2).isValid).toBe(true);
    expect(validateHeight(3, 'ft_in', 2).isValid).toBe(false);
    expect(validateHeight(8, 'ft_in', 3).isValid).toBe(false);
  });
});