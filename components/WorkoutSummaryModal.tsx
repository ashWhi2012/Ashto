import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfile, WorkoutData } from '../utils/calorieCalculator';

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
  calculationMethod: 'complete_profile' | 'default_values';
  profileCompleteness: number;
  recommendations?: string[];
  errors: string[];
  warnings: string[];
  fallbacksUsed: string[];
}

export interface WorkoutSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  workoutData: WorkoutData;
  calorieResult: CalorieCalculationResult;
  userProfile: UserProfile | null;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  visible,
  onClose,
  workoutData,
  calorieResult,
  userProfile,
}) => {
  const { theme } = useTheme();
  const [animatedCalories, setAnimatedCalories] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const calorieCountAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles(theme);

  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      calorieCountAnim.setValue(0);
      setAnimatedCalories(0);

      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start calorie counter animation after modal is visible
        Animated.timing(calorieCountAnim, {
          toValue: calorieResult.totalCalories,
          duration: 1500,
          useNativeDriver: false,
        }).start();
      });

      // Animate calorie counter
      const listener = calorieCountAnim.addListener(({ value }) => {
        setAnimatedCalories(Math.round(value));
      });

      return () => {
        calorieCountAnim.removeListener(listener);
      };
    }
  }, [visible, calorieResult.totalCalories]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const getExerciseTypes = (): string => {
    const uniqueExercises = [...new Set(workoutData.exercises.map(ex => ex.name))];
    if (uniqueExercises.length <= 2) {
      return uniqueExercises.join(' & ');
    }
    return `${uniqueExercises.slice(0, 2).join(', ')} & ${uniqueExercises.length - 2} more`;
  };

  const isUsingDefaults = calorieResult.calculationMethod === 'default_values';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={handleClose}
          accessibilityLabel="Close workout summary"
          accessibilityRole="button"
        />
        
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Workout Complete!</Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Animated Calorie Counter */}
            <View style={styles.calorieSection}>
              <Text style={styles.calorieLabel}>Calories Burned</Text>
              <Text style={styles.calorieCount}>
                {animatedCalories}
              </Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>

            {/* Workout Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>
                  {formatDuration(workoutData.duration)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Exercises</Text>
                <Text style={styles.summaryValue}>
                  {getExerciseTypes()}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Average MET</Text>
                <Text style={styles.summaryValue}>
                  {calorieResult.averageMET}
                </Text>
              </View>
            </View>

            {/* Error Messages */}
            {calorieResult.errors.length > 0 && (
              <View style={styles.errorSection}>
                <Text style={styles.errorIcon}>❌</Text>
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>
                    Calculation Errors
                  </Text>
                  {calorieResult.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Warning Messages */}
            {calorieResult.warnings.length > 0 && (
              <View style={styles.warningSection}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>
                    Calculation Warnings
                  </Text>
                  {calorieResult.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Profile Status Warning */}
            {isUsingDefaults && (
              <View style={styles.warningSection}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>
                    Using Default Values
                  </Text>
                  <Text style={styles.warningText}>
                    Complete your profile in Settings for more accurate calorie calculations.
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Profile completeness: {calorieResult.profileCompleteness}%
                  </Text>
                </View>
              </View>
            )}

            {/* Fallbacks Used */}
            {calorieResult.fallbacksUsed.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>
                    Fallbacks Applied
                  </Text>
                  {calorieResult.fallbacksUsed.map((fallback, index) => (
                    <Text key={index} style={styles.infoText}>
                      • {fallback}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Exercise Breakdown */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Exercise Breakdown</Text>
              <View style={styles.totalCaloriesRow}>
                <Text style={styles.totalCaloriesLabel}>Total Calories Burned</Text>
                <Text style={styles.totalCaloriesValue}>
                  {Math.round(calorieResult.totalCalories)} kcal
                </Text>
              </View>
              
              {calorieResult.exerciseBreakdown.map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.intensity} intensity • {exercise.metValue} MET
                    </Text>
                  </View>
                  <View style={styles.exerciseCaloriesContainer}>
                    <Text style={styles.exerciseCalories}>
                      {Math.round(exercise.calories)}
                    </Text>
                    <Text style={styles.exerciseCaloriesUnit}>kcal</Text>
                  </View>
                </View>
              ))}
              
              {/* Calculation accuracy indicator */}
              <View style={styles.accuracyIndicator}>
                <Text style={styles.accuracyLabel}>Calculation Accuracy</Text>
                <View style={styles.accuracyBar}>
                  <View 
                    style={[
                      styles.accuracyFill,
                      { 
                        width: `${calorieResult.profileCompleteness}%`,
                        backgroundColor: calorieResult.profileCompleteness >= 80 
                          ? theme.success 
                          : calorieResult.profileCompleteness >= 50 
                            ? theme.warning 
                            : theme.error
                      }
                    ]}
                  />
                </View>
                <Text style={styles.accuracyPercentage}>
                  {calorieResult.profileCompleteness}%
                </Text>
              </View>
            </View>

            {/* Calculation Method Indicator */}
            <View style={styles.methodSection}>
              <Text style={styles.methodLabel}>Calculation Method</Text>
              <Text style={styles.methodValue}>
                {isUsingDefaults 
                  ? 'Default profile values (70kg, 30yr, male)'
                  : 'Your personal profile'
                }
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleClose}
              accessibilityLabel="Done"
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.textSecondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.textSecondary,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  calorieSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  calorieLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  calorieCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.primary,
    lineHeight: 56,
  },
  calorieUnit: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: -8,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: theme.textSecondary + '20',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.warning + '15',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  errorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.error + '15',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.error,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.primary + '15',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  breakdownSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: theme.textSecondary + '20',
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.textSecondary + '10',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'capitalize',
  },
  totalCaloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: theme.primary + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  totalCaloriesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  totalCaloriesValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
  },
  exerciseCaloriesContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  exerciseCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  exerciseCaloriesUnit: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: -2,
  },
  accuracyIndicator: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.textSecondary + '20',
  },
  accuracyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  accuracyBar: {
    height: 8,
    backgroundColor: theme.textSecondary + '20',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 4,
  },
  accuracyPercentage: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'right',
  },
  methodSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: theme.textSecondary + '20',
  },
  methodLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  methodValue: {
    fontSize: 14,
    color: theme.text,
    fontStyle: 'italic',
  },
  actionButtons: {
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.textSecondary + '20',
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.buttonText,
  },
});