import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, ValidationResult, validateUserProfile } from "../utils/calorieCalculator";

interface ProfileValidationState {
  isValid: boolean;
  errors: string[];
  lastValidated: Date | null;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  isProfileComplete: boolean;
  profileCompleteness: number;
  validationState: ProfileValidationState;
  loadUserProfile: () => Promise<void>;
  calculateProfileCompleteness: (profile: UserProfile | null) => number;
  validateProfile: (profile: Partial<UserProfile>) => ValidationResult;
  isProfileSufficientForCalculations: (profile: UserProfile | null) => boolean;
  getDefaultProfile: () => UserProfile;
  updateValidationState: (profile: UserProfile | null) => void;
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

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    updateValidationState(userProfile);
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem("userProfile");
      if (stored) {
        const profile = JSON.parse(stored);
        setUserProfileState(profile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const setUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
      setUserProfileState(profile);
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
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
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};
