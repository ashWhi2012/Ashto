import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';
import { UserProfile } from '../../utils/calorieCalculator';
import { UserProfileProvider, useUserProfile } from '../UserProfileContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('UserProfileContext Error Handling', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProfileProvider>{children}</UserProfileProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AsyncStorage Error Handling', () => {
    it('should handle AsyncStorage getItem failures with retry', async () => {
      // Mock first two calls to fail, third to succeed
      mockAsyncStorage.getItem
        .mockRejectedValueOnce(new Error('Storage error 1'))
        .mockRejectedValueOnce(new Error('Storage error 2'))
        .mockResolvedValueOnce(JSON.stringify(validProfile));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(true);
        expect(loadResult.retryCount).toBe(2);
        expect(loadResult.data).toEqual(validProfile);
      });
    });

    it('should fail after maximum retry attempts', async () => {
      // Mock all calls to fail
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Persistent storage error'));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(false);
        expect(loadResult.retryCount).toBe(3);
        expect(loadResult.error).toContain('Storage operation failed after 3 attempts');
      });

      expect(result.current.storageError).toContain('Storage operation failed after 3 attempts');
    });

    it('should handle AsyncStorage setItem failures with retry', async () => {
      // Mock first call to fail, second to succeed
      mockAsyncStorage.setItem
        .mockRejectedValueOnce(new Error('Write error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const saveResult = await result.current.setUserProfile(validProfile);
        expect(saveResult.success).toBe(true);
        expect(saveResult.retryCount).toBe(1);
      });
    });

    it('should handle corrupted profile data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json data');
      mockAsyncStorage.removeItem.mockResolvedValue();

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(true);
        expect(loadResult.data).toBeNull();
      });

      // Should have cleared corrupted data
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('userProfile');
    });

    it('should handle profile data with missing fields', async () => {
      const incompleteProfile = { age: 30, sex: 'male' }; // Missing weight, height
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(incompleteProfile));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(true);
        expect(loadResult.data).toEqual(incompleteProfile);
      });

      // Should still load but validation should fail
      expect(result.current.validationState.isValid).toBe(false);
      expect(result.current.validationState.errors.length).toBeGreaterThan(0);
    });

    it('should handle non-object profile data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('not an object'));
      mockAsyncStorage.removeItem.mockResolvedValue();

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(true);
        expect(loadResult.data).toBeNull();
      });

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('userProfile');
    });
  });

  describe('Profile Validation Error Handling', () => {
    it('should reject invalid profile data on save', async () => {
      const invalidProfile = { ...validProfile, age: -5, weight: -10 };

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const saveResult = await result.current.setUserProfile(invalidProfile);
        expect(saveResult.success).toBe(false);
        expect(saveResult.error).toContain('Invalid profile data');
      });

      expect(result.current.storageError).toContain('Invalid profile data');
    });

    it('should handle profile data that is too large', async () => {
      const largeProfile = {
        ...validProfile,
        // Add a very large string to exceed size limit
        notes: 'x'.repeat(20000),
      } as any;

      mockAsyncStorage.setItem.mockRejectedValue(new Error('Profile data too large'));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const saveResult = await result.current.setUserProfile(largeProfile);
        expect(saveResult.success).toBe(false);
        expect(saveResult.error).toContain('Profile data too large');
      });
    });

    it('should update validation state when profile changes', async () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      // Start with valid profile
      mockAsyncStorage.setItem.mockResolvedValue();
      await act(async () => {
        await result.current.setUserProfile(validProfile);
      });

      expect(result.current.validationState.isValid).toBe(true);
      expect(result.current.validationState.errors).toHaveLength(0);

      // Update with invalid profile
      const invalidProfile = { ...validProfile, age: -5 };
      await act(async () => {
        const saveResult = await result.current.setUserProfile(invalidProfile);
        expect(saveResult.success).toBe(false);
      });

      expect(result.current.validationState.isValid).toBe(false);
      expect(result.current.validationState.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should clear storage errors when operation succeeds', async () => {
      // First operation fails
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(false);
      });

      expect(result.current.storageError).toBeTruthy();

      // Second operation succeeds
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validProfile));

      await act(async () => {
        const loadResult = await result.current.loadUserProfile();
        expect(loadResult.success).toBe(true);
      });

      expect(result.current.storageError).toBeNull();
    });

    it('should allow manual error clearing', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        await result.current.loadUserProfile();
      });

      expect(result.current.storageError).toBeTruthy();

      act(() => {
        result.current.clearStorageError();
      });

      expect(result.current.storageError).toBeNull();
    });
  });

  describe('Profile Completeness Calculation', () => {
    it('should handle null profile gracefully', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      const completeness = result.current.calculateProfileCompleteness(null);
      expect(completeness).toBe(0);
    });

    it('should calculate completeness for partial profiles', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      const partialProfile = {
        age: 30,
        sex: 'male',
        weight: 0, // Missing
        height: 175,
      } as UserProfile;

      const completeness = result.current.calculateProfileCompleteness(partialProfile);
      expect(completeness).toBe(75); // 3 out of 4 required fields
    });

    it('should handle profiles with undefined values', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      const profileWithUndefined = {
        age: 30,
        sex: 'male',
        weight: undefined,
        height: undefined,
      } as any;

      const completeness = result.current.calculateProfileCompleteness(profileWithUndefined);
      expect(completeness).toBe(50); // 2 out of 4 required fields
    });
  });

  describe('Default Profile Generation', () => {
    it('should always return a valid default profile', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      const defaultProfile = result.current.getDefaultProfile();
      
      expect(defaultProfile.age).toBeGreaterThan(0);
      expect(defaultProfile.weight).toBeGreaterThan(0);
      expect(defaultProfile.height).toBeGreaterThan(0);
      expect(['male', 'female', 'other']).toContain(defaultProfile.sex);
      expect(defaultProfile.createdAt).toBeTruthy();
      expect(defaultProfile.updatedAt).toBeTruthy();

      const validation = result.current.validateProfile(defaultProfile);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Profile Sufficiency Check', () => {
    it('should correctly identify insufficient profiles', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      expect(result.current.isProfileSufficientForCalculations(null)).toBe(false);

      const insufficientProfile = {
        age: 0,
        sex: 'male',
        weight: 70,
        height: 175,
      } as UserProfile;

      expect(result.current.isProfileSufficientForCalculations(insufficientProfile)).toBe(false);
    });

    it('should correctly identify sufficient profiles', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      expect(result.current.isProfileSufficientForCalculations(validProfile)).toBe(true);
    });
  });
});