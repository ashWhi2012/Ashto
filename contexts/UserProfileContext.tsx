import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, ValidationResult, validateUserProfile } from "../utils/calorieCalculator";
import {
    ErrorLogger,
    SafeAsyncStorage,
    createValidationError,
    withGracefulDegradation
} from "../utils/errorHandling";

/**
 * Storage operation result with error handling
 */
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
}

interface ProfileValidationState {
  isValid: boolean;
  errors: string[];
  lastValidated: Date | null;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => Promise<StorageResult<UserProfile>>;
  isProfileComplete: boolean;
  profileCompleteness: number;
  validationState: ProfileValidationState;
  loadUserProfile: () => Promise<StorageResult<UserProfile>>;
  calculateProfileCompleteness: (profile: UserProfile | null) => number;
  validateProfile: (profile: Partial<UserProfile>) => ValidationResult;
  isProfileSufficientForCalculations: (profile: UserProfile | null) => boolean;
  getDefaultProfile: () => UserProfile;
  updateValidationState: (profile: UserProfile | null) => void;
  storageError: string | null;
  clearStorageError: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

interface UserProfileProviderProps {
  children: React.ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({
  children,
}) => {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [validationState, setValidationState] = useState<ProfileValidationState>({
    isValid: false,
    errors: [],
    lastValidated: null,
  });
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    updateValidationState(userProfile);
  }, [userProfile]);



  const loadUserProfile = async (): Promise<StorageResult<UserProfile>> => {
    const result = await SafeAsyncStorage.getItem<UserProfile>("userProfile");
    
    if (result.success) {
      if (result.data) {
        // Validate the loaded profile structure
        const validation = withGracefulDegradation(
          () => validateUserProfile(result.data!),
          { isValid: false, errors: ['Profile validation failed'] },
          'profile validation'
        );
        
        if (!validation.isValid) {
          console.warn('Loaded profile has validation issues:', validation.errors);
          // Still set the profile but update validation state
        }
        
        setUserProfileState(result.data);
      } else {
        // No profile stored - this is normal for new users
        setUserProfileState(null);
      }
      
      setStorageError(null);
    } else if (result.error) {
      ErrorLogger.log(result.error);
      setStorageError(result.error.details.userMessage);
    }

    return {
      success: result.success,
      data: result.data || null,
      error: result.error?.details.userMessage,
      retryCount: result.retryCount
    };
  };

  const setUserProfile = async (profile: UserProfile): Promise<StorageResult<UserProfile>> => {
    // Validate profile before saving
    const validation = withGracefulDegradation(
      () => validateUserProfile(profile),
      { isValid: false, errors: ['Profile validation failed'] },
      'profile validation'
    );
    
    if (!validation.isValid) {
      const validationError = createValidationError(
        'profile',
        profile,
        validation.errors.join(', ')
      );
      
      ErrorLogger.log(validationError);
      setStorageError(validationError.details.userMessage);
      
      return {
        success: false,
        error: validationError.details.userMessage
      };
    }

    // Add timestamp
    const profileWithTimestamp = {
      ...profile,
      updatedAt: new Date().toISOString()
    };

    const result = await SafeAsyncStorage.setItem("userProfile", profileWithTimestamp);
    
    if (result.success) {
      setUserProfileState(profileWithTimestamp);
      setStorageError(null);
    } else if (result.error) {
      ErrorLogger.log(result.error);
      setStorageError(result.error.details.userMessage);
    }

    return {
      success: result.success,
      data: result.success ? profileWithTimestamp : undefined,
      error: result.error?.details.userMessage,
      retryCount: result.retryCount
    };
  };

  const clearStorageError = () => {
    setStorageError(null);
  };

  const calculateProfileCompleteness = (profile: UserProfile | null): number => {
    if (!profile) return 0;
    
    const requiredFields = ['age', 'sex', 'weight', 'height'];
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value !== undefined && value !== null && value !== 0 && value !== '';
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const validateProfile = (profile: Partial<UserProfile>): ValidationResult => {
    return validateUserProfile(profile);
  };

  const isProfileSufficientForCalculations = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    return profile.age > 0 && profile.weight > 0 && profile.height > 0 && profile.sex !== undefined;
  };

  const getDefaultProfile = (): UserProfile => {
    const now = new Date().toISOString();
    return {
      age: 30,
      sex: 'male',
      weight: 70,
      height: 175,
      activityLevel: 'moderately_active',
      weightUnit: 'kg',
      heightUnit: 'cm',
      createdAt: now,
      updatedAt: now,
    };
  };

  const updateValidationState = (profile: UserProfile | null) => {
    if (!profile) {
      setValidationState({
        isValid: false,
        errors: ['Profile is required'],
        lastValidated: new Date(),
      });
      return;
    }

    const validation = validateUserProfile(profile);
    setValidationState({
      isValid: validation.isValid,
      errors: validation.errors,
      lastValidated: new Date(),
    });
  };

  const profileCompleteness = calculateProfileCompleteness(userProfile);
  const isProfileComplete = isProfileSufficientForCalculations(userProfile);

  return (
    <UserProfileContext.Provider
      value={{
        userProfile,
        setUserProfile,
        isProfileComplete,
        profileCompleteness,
        validationState,
        loadUserProfile,
        calculateProfileCompleteness,
        validateProfile,
        isProfileSufficientForCalculations,
        getDefaultProfile,
        updateValidationState,
        storageError,
        clearStorageError,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};
