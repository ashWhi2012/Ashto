import { render } from '@testing-library/react-native';
import React from 'react';
import { UserProfile } from '../../utils/calorieCalculator';
import { UserProfileProvider, useUserProfile } from '../UserProfileContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Test component to access context
const TestComponent = () => {
  const {
    userProfile,
    profileCompleteness,
    isProfileComplete,
    validationState,
    calculateProfileCompleteness,
    isProfileSufficientForCalculations,
    getDefaultProfile,
    validateProfile,
  } = useUserProfile();

  return null;
};

describe('UserProfileContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide default profile generation', () => {
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useUserProfile();
      return null;
    };

    render(
      <UserProfileProvider>
        <TestComponent />
      </UserProfileProvider>
    );

    const defaultProfile = contextValue.getDefaultProfile();
    
    expect(defaultProfile).toEqual({
      age: 30,
      sex: 'male',
      weight: 70,
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should calculate profile completeness correctly', () => {
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useUserProfile();
      return null;
    };

    render(
      <UserProfileProvider>
        <TestComponent />
      </UserProfileProvider>
    );

    // Test with null profile
    expect(contextValue.calculateProfileCompleteness(null)).toBe(0);

    // Test with incomplete profile
    const incompleteProfile: Partial<UserProfile> = {
      age: 25,
      weight: 70,
    };
    expect(contextValue.calculateProfileCompleteness(incompleteProfile)).toBe(50);

    // Test with complete profile
    const completeProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 70,
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    expect(contextValue.calculateProfileCompleteness(completeProfile)).toBe(100);
  });

  it('should check if profile is sufficient for calculations', () => {
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useUserProfile();
      return null;
    };

    render(
      <UserProfileProvider>
        <TestComponent />
      </UserProfileProvider>
    );

    // Test with null profile
    expect(contextValue.isProfileSufficientForCalculations(null)).toBe(false);

    // Test with insufficient profile
    const insufficientProfile: Partial<UserProfile> = {
      age: 25,
      weight: 70,
    };
    expect(contextValue.isProfileSufficientForCalculations(insufficientProfile)).toBe(false);

    // Test with sufficient profile
    const sufficientProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 70,
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    expect(contextValue.isProfileSufficientForCalculations(sufficientProfile)).toBe(true);
  });

  it('should validate profile correctly', () => {
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useUserProfile();
      return null;
    };

    render(
      <UserProfileProvider>
        <TestComponent />
      </UserProfileProvider>
    );

    // Test with valid profile
    const validProfile: UserProfile = {
      age: 25,
      sex: 'male',
      weight: 70,
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    
    const validationResult = contextValue.validateProfile(validProfile);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);

    // Test with invalid profile
    const invalidProfile: Partial<UserProfile> = {
      age: 10, // Too young
      sex: 'invalid' as any,
      weight: -5, // Invalid weight
    };
    
    const invalidValidationResult = contextValue.validateProfile(invalidProfile);
    expect(invalidValidationResult.isValid).toBe(false);
    expect(invalidValidationResult.errors.length).toBeGreaterThan(0);
  });

  it('should manage validation state correctly', () => {
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useUserProfile();
      return null;
    };

    render(
      <UserProfileProvider>
        <TestComponent />
      </UserProfileProvider>
    );

    // Initial state should be invalid with no profile
    expect(contextValue.validationState.isValid).toBe(false);
    expect(contextValue.validationState.errors).toContain('Profile is required');
    expect(contextValue.validationState.lastValidated).toBeInstanceOf(Date);
  });
});