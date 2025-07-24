import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Exercise } from '../types/workout';

interface CardioExerciseInputProps {
  exercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
  onRemove: () => void;
  isReadOnly?: boolean;
}

export const CardioExerciseInput: React.FC<CardioExerciseInputProps> = ({
  exercise,
  onExerciseChange,
  onRemove,
  isReadOnly = false,
}) => {
  const { theme } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateExercise = (updates: Partial<Exercise>) => {
    onExerciseChange({ ...exercise, ...updates });
  };

  const togglePaceUnit = () => {
    const newUnit = exercise.paceUnit === 'mph' ? 'kmh' : 'mph';
    updateExercise({ paceUnit: newUnit });
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {!isReadOnly && (
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Basic fields - Duration (using sets field) */}
      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Duration (min)</Text>
          <TextInput
            style={styles.input}
            value={exercise.sets.toString()}
            onChangeText={(text) => updateExercise({ sets: parseInt(text) || 0 })}
            keyboardType="numeric"
            placeholder="30"
            editable={!isReadOnly}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Intensity (1-10)</Text>
          <TextInput
            style={styles.input}
            value={exercise.reps.toString()}
            onChangeText={(text) => updateExercise({ reps: parseInt(text) || 5 })}
            keyboardType="numeric"
            placeholder="5"
            editable={!isReadOnly}
          />
        </View>
      </View>

      {/* Advanced cardio fields toggle */}
      {!isReadOnly && (
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? '▼' : '▶'} Advanced Cardio Settings
          </Text>
        </TouchableOpacity>
      )}

      {/* Advanced cardio fields */}
      {(showAdvanced || isReadOnly) && (
        <View style={styles.advancedSection}>
          {/* Pace */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Pace (optional)</Text>
              <TextInput
                style={styles.input}
                value={exercise.pace?.toString() || ''}
                onChangeText={(text) => 
                  updateExercise({ pace: text ? parseFloat(text) : undefined })
                }
                keyboardType="numeric"
                placeholder="6.0"
                editable={!isReadOnly}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit</Text>
              <TouchableOpacity
                style={[styles.input, styles.unitButton]}
                onPress={togglePaceUnit}
                disabled={isReadOnly}
              >
                <Text style={styles.unitButtonText}>
                  {exercise.paceUnit || 'mph'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Elevation Angle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Elevation Angle (degrees, optional)</Text>
            <TextInput
              style={styles.input}
              value={exercise.elevationAngle?.toString() || ''}
              onChangeText={(text) => 
                updateExercise({ elevationAngle: text ? parseFloat(text) : undefined })
              }
              keyboardType="numeric"
              placeholder="0 (flat), 5 (uphill), -3 (downhill)"
              editable={!isReadOnly}
            />
            <Text style={styles.helperText}>
              Positive for uphill, negative for downhill
            </Text>
          </View>

          {/* Interval Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interval Time (seconds, optional)</Text>
            <TextInput
              style={styles.input}
              value={exercise.intervalTime?.toString() || ''}
              onChangeText={(text) => 
                updateExercise({ intervalTime: text ? parseInt(text) : undefined })
              }
              keyboardType="numeric"
              placeholder="60 (for 1-minute intervals)"
              editable={!isReadOnly}
            />
            <Text style={styles.helperText}>
              For interval training - duration of each interval
            </Text>
          </View>
        </View>
      )}

      {/* Display advanced fields in read-only mode if they have values */}
      {isReadOnly && (exercise.pace || exercise.elevationAngle || exercise.intervalTime) && (
        <View style={styles.readOnlyAdvanced}>
          {exercise.pace && (
            <Text style={styles.readOnlyText}>
              Pace: {exercise.pace} {exercise.paceUnit || 'mph'}
            </Text>
          )}
          {exercise.elevationAngle !== undefined && (
            <Text style={styles.readOnlyText}>
              Elevation: {exercise.elevationAngle > 0 ? '+' : ''}{exercise.elevationAngle}°
            </Text>
          )}
          {exercise.intervalTime && (
            <Text style={styles.readOnlyText}>
              Intervals: {exercise.intervalTime}s each
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: theme.secondary, // Different color for cardio
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    removeButton: {
      backgroundColor: theme.error,
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButtonText: {
      color: theme.buttonText,
      fontSize: 18,
      fontWeight: 'bold',
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    inputGroup: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 5,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.textSecondary,
      padding: 10,
      borderRadius: 8,
      fontSize: 16,
      backgroundColor: theme.background,
      color: theme.text,
    },
    unitButton: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.primary,
    },
    unitButtonText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    advancedToggle: {
      paddingVertical: 10,
      marginVertical: 5,
    },
    advancedToggleText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    advancedSection: {
      backgroundColor: theme.background,
      padding: 10,
      borderRadius: 8,
      marginTop: 5,
    },
    helperText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
      fontStyle: 'italic',
    },
    readOnlyAdvanced: {
      backgroundColor: theme.background,
      padding: 10,
      borderRadius: 8,
      marginTop: 10,
    },
    readOnlyText: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 2,
    },
  });