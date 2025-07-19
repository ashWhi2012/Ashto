import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export interface ExerciseType {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface WorkoutCategory {
  id: string;
  name: string;
  exercises: ExerciseType[];
}

const DEFAULT_CATEGORIES = [
  "Arms",
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Core",
  "Cardio",
];

export default function WorkoutTypesManager() {
  const { theme } = useTheme();
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showGenerateWorkout, setShowGenerateWorkout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Form states
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("Arms");
  const [exerciseDescription, setExerciseDescription] = useState("");

  useEffect(() => {
    loadExerciseTypes();
    loadCategories();
  }, []);

  // Reload categories when tab becomes active (to sync with Settings changes)
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadExerciseTypes = async () => {
    try {
      const stored = await AsyncStorage.getItem("exerciseTypes");
      if (stored) {
        setExerciseTypes(JSON.parse(stored));
      } else {
        // Load default exercises if none exist
        const defaultExercises = getDefaultExercises();
        setExerciseTypes(defaultExercises);
        await AsyncStorage.setItem(
          "exerciseTypes",
          JSON.stringify(defaultExercises)
        );
      }
    } catch (error) {
      console.error("Error loading exercise types:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem("exerciseCategories");
      if (stored) {
        const loadedCategories = JSON.parse(stored);
        setCategories(loadedCategories);
        // Update the default exercise category to the first available category
        if (
          loadedCategories.length > 0 &&
          !loadedCategories.includes(exerciseCategory)
        ) {
          setExerciseCategory(loadedCategories[0]);
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const getDefaultExercises = (): ExerciseType[] => [
    {
      id: "1",
      name: "Bicep Curls",
      category: "Arms",
      description: "Curl weights to work biceps",
    },
    {
      id: "2",
      name: "Tricep Dips",
      category: "Arms",
      description: "Dips to work triceps",
    },
    {
      id: "3",
      name: "Push-ups",
      category: "Chest",
      description: "Classic chest exercise",
    },
    {
      id: "4",
      name: "Squats",
      category: "Legs",
      description: "Lower body compound movement",
    },
    {
      id: "5",
      name: "Lunges",
      category: "Legs",
      description: "Single leg strength exercise",
    },
    {
      id: "6",
      name: "Pull-ups",
      category: "Back",
      description: "Upper body pulling exercise",
    },
    {
      id: "7",
      name: "Shoulder Press",
      category: "Shoulders",
      description: "Overhead pressing movement",
    },
    {
      id: "8",
      name: "Plank",
      category: "Core",
      description: "Core stability exercise",
    },
  ];

  const saveExerciseTypes = async (newExercises: ExerciseType[]) => {
    try {
      await AsyncStorage.setItem("exerciseTypes", JSON.stringify(newExercises));
      setExerciseTypes(newExercises);
    } catch (error) {
      console.error("Error saving exercise types:", error);
    }
  };

  const addExerciseType = () => {
    if (!exerciseName.trim()) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }

    const newExercise: ExerciseType = {
      id: Date.now().toString(),
      name: exerciseName.trim(),
      category: exerciseCategory,
      description: exerciseDescription.trim(),
    };

    const updatedExercises = [...exerciseTypes, newExercise];
    saveExerciseTypes(updatedExercises);

    setExerciseName("");
    setExerciseDescription("");
    setShowAddExercise(false);
    Alert.alert("Success", "Exercise added successfully!");
  };

  const deleteExerciseType = (id: string) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedExercises = exerciseTypes.filter((ex) => ex.id !== id);
            saveExerciseTypes(updatedExercises);
          },
        },
      ]
    );
  };

  const getExercisesByCategory = (category: string) => {
    return exerciseTypes.filter((ex) => ex.category === category);
  };

  const findLastExerciseData = async (exerciseName: string) => {
    try {
      const stored = await AsyncStorage.getItem("workouts");
      if (!stored) return null;

      const workouts = JSON.parse(stored);
      // Find the most recent workout that contains this exercise
      const sortedWorkouts = [...workouts].sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const workout of sortedWorkouts) {
        const exercise = workout.exercises.find(
          (ex: any) => ex.name === exerciseName
        );
        if (exercise) {
          return {
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            lastDate: workout.date,
          };
        }
      }

      return null; // No previous data found
    } catch (error) {
      console.error("Error finding last exercise data:", error);
      return null;
    }
  };

  const generateWorkout = async (category: string, exerciseCount: number) => {
    const categoryExercises = getExercisesByCategory(category);
    if (categoryExercises.length < exerciseCount) {
      Alert.alert(
        "Error",
        `Not enough exercises in ${category} category. Add more exercises first.`
      );
      return;
    }

    // Randomly select exercises
    const shuffled = [...categoryExercises].sort(() => 0.5 - Math.random());
    const selectedExercises = shuffled.slice(0, exerciseCount);

    // Check for previous data for each exercise and create detailed information
    const exercisesWithHistory = [];
    const exercisesWithoutHistory = [];
    const exerciseDetails = [];

    for (const exercise of selectedExercises) {
      const previousData = await findLastExerciseData(exercise.name);
      if (previousData) {
        exercisesWithHistory.push(exercise);
        const lastDate = new Date(previousData.lastDate).toLocaleDateString();
        exerciseDetails.push(
          `${exercise.name}: ${previousData.sets} sets × ${previousData.reps} reps @ ${previousData.weight}lbs (from ${lastDate})`
        );
      } else {
        exercisesWithoutHistory.push(exercise);
        exerciseDetails.push(
          `${exercise.name}: 3 sets × 10 reps @ 0lbs (default)`
        );
      }
    }

    // Create detailed alert message
    let alertMessage = `Generated ${category} workout with ${selectedExercises.length} exercises:`;
    alertMessage += `\n\n${exerciseDetails.join("\n")}`;

    if (exercisesWithHistory.length > 0) {
      alertMessage += `\n\n✅ ${exercisesWithHistory.length} exercise${
        exercisesWithHistory.length > 1 ? "s" : ""
      } will be auto-filled from previous workouts`;
    }

    if (exercisesWithoutHistory.length > 0) {
      alertMessage += `\n\n🆕 ${exercisesWithoutHistory.length} new exercise${
        exercisesWithoutHistory.length > 1 ? "s" : ""
      } will use default values`;
    }

    alertMessage +=
      "\n\nGo to the Workout tab to start this workout with auto-filled data!";

    Alert.alert("Workout Generated!", alertMessage, [
      { text: "OK", onPress: () => setShowGenerateWorkout(false) },
    ]);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout Manager</Text>

      <Pressable
        style={styles.addButton}
        onPress={() => setShowAddExercise(true)}
      >
        <Text style={styles.buttonText}>Add New Exercise</Text>
      </Pressable>

      <Pressable
        style={styles.generateButton}
        onPress={() => setShowGenerateWorkout(true)}
      >
        <Text style={styles.buttonText}>Generate Workout</Text>
      </Pressable>

      {categories.map((category) => {
        const categoryExercises = getExercisesByCategory(category);
        return (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {category} ({categoryExercises.length})
            </Text>
            {categoryExercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.description && (
                    <Text style={styles.exerciseDescription}>
                      {exercise.description}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteExerciseType(exercise.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </Pressable>
              </View>
            ))}
            {categoryExercises.length === 0 && (
              <Text style={styles.noExercisesText}>
                No exercises in this category
              </Text>
            )}
          </View>
        );
      })}

      {/* Add Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Exercise</Text>

            <TextInput
              style={styles.input}
              placeholder="Exercise name (e.g., Bicep Curls)"
              value={exerciseName}
              onChangeText={setExerciseName}
            />

            <Text style={styles.inputLabel}>Category:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categorySelector}
            >
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryOption,
                    exerciseCategory === category && styles.selectedCategory,
                  ]}
                  onPress={() => setExerciseCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      exerciseCategory === category &&
                        styles.selectedCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (optional)"
              value={exerciseDescription}
              onChangeText={setExerciseDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddExercise(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.addModalButton]}
                onPress={addExerciseType}
              >
                <Text style={styles.buttonText}>Add Exercise</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Workout Modal */}
      <Modal visible={showGenerateWorkout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate Workout</Text>

            <ScrollView
              style={styles.generateScrollView}
              showsVerticalScrollIndicator={true}
            >
              {categories.map((category) => {
                const count = getExercisesByCategory(category).length;
                return (
                  <View key={category} style={styles.generateOption}>
                    <Text style={styles.generateCategoryTitle}>
                      {category} ({count} exercises)
                    </Text>
                    <View style={styles.generateButtons}>
                      {[3, 4, 5].map((exerciseCount) => (
                        <Pressable
                          key={exerciseCount}
                          style={[
                            styles.generateCountButton,
                            count < exerciseCount && styles.disabledButton,
                          ]}
                          onPress={() =>
                            generateWorkout(category, exerciseCount)
                          }
                          disabled={count < exerciseCount}
                        >
                          <Text
                            style={[
                              styles.generateCountText,
                              count < exerciseCount && styles.disabledText,
                            ]}
                          >
                            {exerciseCount} exercises
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.closeButton}
              onPress={() => setShowGenerateWorkout(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 30,
      color: theme.text,
    },
    addButton: {
      backgroundColor: theme.success,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    generateButton: {
      backgroundColor: theme.secondary,
      padding: 15,
      borderRadius: 10,
      marginBottom: 30,
    },
    buttonText: {
      color: "white",
      textAlign: "center",
      fontSize: 16,
      fontWeight: "bold",
    },
    categorySection: {
      marginBottom: 25,
    },
    categoryTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 15,
      color: theme.text,
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
      paddingBottom: 5,
    },
    exerciseCard: {
      backgroundColor: theme.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
    },
    exerciseDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 5,
    },
    deleteButton: {
      backgroundColor: theme.error,
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    noExercisesText: {
      textAlign: "center",
      fontSize: 14,
      color: theme.textSecondary,
      fontStyle: "italic",
      marginVertical: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.surface,
      padding: 20,
      borderRadius: 15,
      width: "90%",
      maxWidth: 400,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.textSecondary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      fontSize: 16,
      backgroundColor: theme.surface,
      color: theme.text,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
      color: theme.text,
    },
    categorySelector: {
      marginBottom: 15,
    },
    categoryOption: {
      backgroundColor: theme.background,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    selectedCategory: {
      backgroundColor: theme.primary,
    },
    categoryOptionText: {
      fontSize: 14,
      color: theme.text,
    },
    selectedCategoryText: {
      color: "white",
      fontWeight: "bold",
    },
    descriptionInput: {
      height: 80,
      textAlignVertical: "top",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 10,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: theme.textSecondary,
    },
    addModalButton: {
      backgroundColor: theme.success,
    },
    generateOption: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: theme.background,
      borderRadius: 10,
    },
    generateCategoryTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
      color: theme.text,
    },
    generateButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    generateCountButton: {
      flex: 1,
      backgroundColor: theme.secondary,
      padding: 10,
      borderRadius: 8,
    },
    disabledButton: {
      backgroundColor: theme.textSecondary,
      opacity: 0.5,
    },
    generateCountText: {
      color: "white",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "bold",
    },
    disabledText: {
      color: theme.textSecondary,
    },
    closeButton: {
      backgroundColor: theme.textSecondary,
      padding: 15,
      borderRadius: 10,
      marginTop: 20,
    },
    generateScrollView: {
      maxHeight: 400,
      marginBottom: 10,
    },
  });
