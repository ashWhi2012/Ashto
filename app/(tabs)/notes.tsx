import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { CalorieCalculationErrorBoundary } from "../../components/CalorieCalculationErrorBoundary";
import { CardioExerciseInput } from "../../components/CardioExerciseInput";
import {
  CalorieCalculationResult,
  WorkoutSummaryModal,
} from "../../components/WorkoutSummaryModal";
import { useTheme } from "../../contexts/ThemeContext";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { CalorieData, Exercise, WorkoutRecord } from "../../types/workout";
import {
  calculateWorkoutCalories,
  WorkoutData,
} from "../../utils/calorieCalculator";
import {
  createErrorFromException,
  ErrorLogger,
  withGracefulDegradation,
} from "../../utils/errorHandling";

export default function WorkoutTracker() {
  const { theme } = useTheme();
  const {
    userProfile,
    isProfileComplete,
    profileCompleteness,
    getDefaultProfile,
  } = useUserProfile();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Exercise[]>([]);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(
    null
  );
  const [showGenerateWorkout, setShowGenerateWorkout] = useState(false);
  const [exerciseTypes, setExerciseTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "Arms",
    "Legs",
    "Chest",
    "Back",
    "Shoulders",
    "Core",
    "Cardio",
  ]);
  const [showEditExercise, setShowEditExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [workoutRetentionWeeks, setWorkoutRetentionWeeks] = useState(4);

  // Max workout tracking
  const [isMaxWorkout, setIsMaxWorkout] = useState(false);

  // Workout summary modal states
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [workoutSummaryData, setWorkoutSummaryData] =
    useState<WorkoutData | null>(null);
  const [calorieCalculationResult, setCalorieCalculationResult] =
    useState<CalorieCalculationResult | null>(null);

  // Form states
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const loadWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem("workouts");
      if (stored) {
        setWorkouts(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
    }
  };

  const loadExerciseTypes = async () => {
    try {
      const stored = await AsyncStorage.getItem("exerciseTypes");
      if (stored) {
        setExerciseTypes(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading exercise types:", error);
    }
  };

  const loadWorkoutRetention = async () => {
    try {
      const stored = await AsyncStorage.getItem("workoutRetentionWeeks");
      if (stored) {
        setWorkoutRetentionWeeks(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading workout retention:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem("exerciseCategories");
      if (stored) {
        setCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    loadWorkouts();
    loadExerciseTypes();
    loadWorkoutRetention();
    loadCategories();
  }, []);

  // Reload categories and exercise types when tab becomes active (to sync with changes from other tabs)
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
      loadExerciseTypes();
    }, [loadCategories, loadExerciseTypes])
  );

  const saveWorkouts = async (newWorkouts: WorkoutRecord[]) => {
    try {
      await AsyncStorage.setItem("workouts", JSON.stringify(newWorkouts));
      setWorkouts(newWorkouts);
    } catch (error) {
      console.error("Error saving workouts:", error);
    }
  };

  const startWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setCurrentWorkout([]);
  };

  const addExercise = () => {
    if (!exerciseName || !sets || !reps || !weight) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight),
    };

    setCurrentWorkout([...currentWorkout, newExercise]);
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    setShowAddExercise(false);
  };

  const finishWorkout = async () => {
    if (currentWorkout.length === 0) {
      Alert.alert("Error", "Add at least one exercise to finish workout");
      return;
    }

    const duration = workoutStartTime
      ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000)
      : 0;

    // Calculate calories burned
    const workoutData: WorkoutData = {
      exercises: currentWorkout.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
      })),
      duration,
    };

    // Create exercise categories mapping
    const exerciseCategories: { [exerciseName: string]: string } = {};
    currentWorkout.forEach((exercise) => {
      const exerciseType = exerciseTypes.find(
        (et) => et.name === exercise.name
      );
      exerciseCategories[exercise.name] = exerciseType?.category || "default";
    });

    // Determine which profile to use for calculations
    const profileToUse =
      userProfile && isProfileComplete ? userProfile : getDefaultProfile();
    const isUsingDefaults = !userProfile || !isProfileComplete;

    // Convert weight from lbs to kg if needed (app uses lbs, calculator expects kg)
    const profileForCalculation = {
      ...profileToUse,
      weight:
        profileToUse.weightUnit === "lbs"
          ? profileToUse.weight * 0.453592
          : profileToUse.weight,
    };

    // Calculate calories with error handling
    const calorieResult = withGracefulDegradation(
      () =>
        calculateWorkoutCalories(
          workoutData,
          profileForCalculation,
          exerciseCategories
        ),
      {
        success: false,
        totalCalories: 0,
        exerciseBreakdown: [],
        averageMET: 0,
        errors: ["Calorie calculation failed - using fallback"],
        warnings: ["Workout saved without calorie data"],
        fallbacksUsed: ["Default calorie calculation fallback applied"],
      },
      "workout calorie calculation"
    );

    // Create calorie data for workout record
    const calorieData: CalorieData = {
      totalCalories: calorieResult.totalCalories,
      calculationMethod: isUsingDefaults
        ? "default_values"
        : "complete_profile",
      profileSnapshot: {
        age: profileForCalculation.age,
        sex: profileForCalculation.sex,
        weight: profileForCalculation.weight,
        height: profileForCalculation.height,
        activityLevel: profileForCalculation.activityLevel,
      },
      exerciseBreakdown: calorieResult.exerciseBreakdown,
      averageMET: calorieResult.averageMET,
      profileCompleteness: profileCompleteness,
    };

    // Create new workout record with calorie data
    const newWorkout: WorkoutRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: currentWorkout,
      duration,
      calorieData,
      isMaxWorkout, // Include max workout flag
    };

    // Create calorie calculation result with additional metadata for modal
    const calorieCalculationResult: CalorieCalculationResult = {
      ...calorieResult,
      calculationMethod: isUsingDefaults
        ? "default_values"
        : "complete_profile",
      profileCompleteness: profileCompleteness,
      recommendations: isUsingDefaults
        ? [
            "Complete your profile in Settings for more accurate calorie calculations",
            "Add your age, weight, height, and activity level for personalized results",
          ]
        : undefined,
    };

    // Save workout data
    const updatedWorkouts = [newWorkout, ...workouts];
    saveWorkouts(updatedWorkouts);

    // Set state for workout summary modal
    setWorkoutSummaryData(workoutData);
    setCalorieCalculationResult(calorieCalculationResult);

    // Save max records if this is a max workout
    if (isMaxWorkout) {
      await saveMaxRecords(newWorkout);
    }

    // Reset workout state
    setIsWorkoutActive(false);
    setCurrentWorkout([]);
    setWorkoutStartTime(null);
    setIsMaxWorkout(false); // Reset max workout flag

    // Show workout summary modal instead of simple alert
    setShowWorkoutSummary(true);
  };

  const getFilteredWorkouts = () => {
    // If retention is set to "Forever" (-1), return all workouts
    if (workoutRetentionWeeks === -1) {
      return workouts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - workoutRetentionWeeks * 7);

    return workouts
      .filter((workout) => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= cutoffDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getWeeksAgo = (dateString: string) => {
    const workoutDate = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - workoutDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
  };

  const getExercisesByCategory = (category: string) => {
    return exerciseTypes.filter((ex: any) => ex.category === category);
  };

  const isCardioExercise = (exerciseName: string): boolean => {
    const exerciseType = exerciseTypes.find((et) => et.name === exerciseName);
    return exerciseType?.category === "Cardio";
  };

  const findLastExerciseData = (exerciseName: string) => {
    // Find the most recent workout that contains this exercise
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const workout of sortedWorkouts) {
      const exercise = workout.exercises.find((ex) => ex.name === exerciseName);
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
  };

  const generateWorkout = (category: string, exerciseCount: number) => {
    const categoryExercises = getExercisesByCategory(category);
    if (categoryExercises.length < exerciseCount) {
      Alert.alert(
        "Error",
        `Not enough exercises in ${category} category. Add more exercises in the Exercise Types tab first.`
      );
      return;
    }

    // Randomly select exercises
    const shuffled = [...categoryExercises].sort(() => 0.5 - Math.random());
    const selectedExercises = shuffled.slice(0, exerciseCount);

    // Start workout with pre-selected exercises
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());

    // Create exercises with previous data if available, otherwise use defaults
    const presetExercises = selectedExercises.map((exerciseType: any) => {
      const previousData = findLastExerciseData(exerciseType.name);

      return {
        id: Date.now().toString() + Math.random(),
        name: exerciseType.name,
        sets: previousData ? previousData.sets : 3,
        reps: previousData ? previousData.reps : 10,
        weight: previousData ? previousData.weight : 0,
      };
    });

    setCurrentWorkout(presetExercises);
    setShowGenerateWorkout(false);

    // Create a more informative alert showing which exercises have previous data
    const exercisesWithHistory = [];
    const exercisesWithoutHistory = [];
    const exerciseDetails = [];

    for (const exerciseType of selectedExercises) {
      const previousData = findLastExerciseData(exerciseType.name);
      if (previousData) {
        exercisesWithHistory.push(exerciseType);
        const lastDate = new Date(previousData.lastDate).toLocaleDateString();
        exerciseDetails.push(
          `${exerciseType.name}: ${previousData.sets} sets × ${previousData.reps} reps @ ${previousData.weight}lbs (from ${lastDate})`
        );
      } else {
        exercisesWithoutHistory.push(exerciseType);
        exerciseDetails.push(
          `${exerciseType.name}: 3 sets × 10 reps @ 0lbs (default)`
        );
      }
    }

    let alertMessage = `Started ${category} workout with ${selectedExercises.length} exercises:`;
    alertMessage += `\n\n${exerciseDetails.join("\n")}`;

    if (exercisesWithHistory.length > 0) {
      alertMessage += `\n\n✅ ${exercisesWithHistory.length} exercise${
        exercisesWithHistory.length > 1 ? "s" : ""
      } auto-filled from previous workouts`;
    }

    if (exercisesWithoutHistory.length > 0) {
      alertMessage += `\n\n🆕 ${exercisesWithoutHistory.length} new exercise${
        exercisesWithoutHistory.length > 1 ? "s" : ""
      } with default values`;
    }

    alertMessage +=
      "\n\nTap any exercise to customize sets, reps, and weights.";

    Alert.alert("Workout Generated!", alertMessage);
  };

  const addGeneratedExercises = (category: string, exerciseCount: number) => {
    const categoryExercises = getExercisesByCategory(category);
    if (categoryExercises.length < exerciseCount) {
      Alert.alert(
        "Error",
        `Not enough exercises in ${category} category. Add more exercises in the Exercise Types tab first.`
      );
      return;
    }

    // Filter out exercises already in current workout to avoid duplicates
    const currentExerciseNames = currentWorkout.map((ex) => ex.name);
    const availableExercises = categoryExercises.filter(
      (ex) => !currentExerciseNames.includes(ex.name)
    );

    if (availableExercises.length < exerciseCount) {
      Alert.alert(
        "Limited Options",
        `Only ${availableExercises.length} new exercises available in ${category} category (${currentExerciseNames.length} already in workout). Proceeding with available exercises.`
      );
    }

    // Randomly select from available exercises
    const shuffled = [...availableExercises].sort(() => 0.5 - Math.random());
    const selectedExercises = shuffled.slice(
      0,
      Math.min(exerciseCount, availableExercises.length)
    );

    if (selectedExercises.length === 0) {
      Alert.alert(
        "No New Exercises",
        `All ${category} exercises are already in your current workout.`
      );
      return;
    }

    // Create exercises with previous data if available, otherwise use defaults
    const newExercises = selectedExercises.map((exerciseType: any) => {
      const previousData = findLastExerciseData(exerciseType.name);

      return {
        id: Date.now().toString() + Math.random(),
        name: exerciseType.name,
        sets: previousData ? previousData.sets : 3,
        reps: previousData ? previousData.reps : 10,
        weight: previousData ? previousData.weight : 0,
      };
    });

    // Add to current workout
    setCurrentWorkout([...currentWorkout, ...newExercises]);
    setShowGenerateWorkout(false);

    // Create informative alert
    const exercisesWithHistory = [];
    const exercisesWithoutHistory = [];
    const exerciseDetails = [];

    for (const exerciseType of selectedExercises) {
      const previousData = findLastExerciseData(exerciseType.name);
      if (previousData) {
        exercisesWithHistory.push(exerciseType);
        const lastDate = new Date(previousData.lastDate).toLocaleDateString();
        exerciseDetails.push(
          `${exerciseType.name}: ${previousData.sets} sets × ${previousData.reps} reps @ ${previousData.weight}lbs (from ${lastDate})`
        );
      } else {
        exercisesWithoutHistory.push(exerciseType);
        exerciseDetails.push(
          `${exerciseType.name}: 3 sets × 10 reps @ 0lbs (default)`
        );
      }
    }

    let alertMessage = `Added ${selectedExercises.length} ${category} exercise${
      selectedExercises.length > 1 ? "s" : ""
    } to your workout:`;
    alertMessage += `\n\n${exerciseDetails.join("\n")}`;

    if (exercisesWithHistory.length > 0) {
      alertMessage += `\n\n✅ ${exercisesWithHistory.length} exercise${
        exercisesWithHistory.length > 1 ? "s" : ""
      } auto-filled from previous workouts`;
    }

    if (exercisesWithoutHistory.length > 0) {
      alertMessage += `\n\n🆕 ${exercisesWithoutHistory.length} new exercise${
        exercisesWithoutHistory.length > 1 ? "s" : ""
      } with default values`;
    }

    alertMessage +=
      "\n\nTap any exercise to customize sets, reps, and weights.";

    Alert.alert("Exercises Added!", alertMessage);
  };

  const editExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setSets(exercise.sets.toString());
    setReps(exercise.reps.toString());
    setWeight(exercise.weight.toString());
    setShowEditExercise(true);
  };

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    setSets(exercise.sets.toString());
    setReps(exercise.reps.toString());
    setWeight(exercise.weight.toString());
    setShowEditExercise(true);
  };

  const updateExercise = () => {
    if (!editingExercise || !sets || !reps || !weight) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const updatedExercises = currentWorkout.map((exercise) =>
      exercise.id === editingExercise.id
        ? {
            ...exercise,
            sets: parseInt(sets),
            reps: parseInt(reps),
            weight: parseFloat(weight),
          }
        : exercise
    );

    setCurrentWorkout(updatedExercises);
    setShowEditExercise(false);
    setEditingExercise(null);
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    Alert.alert("Success", "Exercise updated!");
  };

  const deleteExerciseFromWorkout = (exerciseId: string) => {
    Alert.alert("Remove Exercise", "Remove this exercise from your workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updatedExercises = currentWorkout.filter(
            (ex) => ex.id !== exerciseId
          );
          setCurrentWorkout(updatedExercises);
        },
      },
    ]);
  };

  const deleteWorkout = (workoutId: string) => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to permanently delete this workout? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);
            saveWorkouts(updatedWorkouts);

            // Remove associated max records
            await removeMaxRecords(workoutId);

            // If we're viewing the deleted workout, go back to history
            if (selectedWorkout && selectedWorkout.id === workoutId) {
              setSelectedWorkout(null);
            }

            Alert.alert("Success", "Workout deleted successfully");
          },
        },
      ]
    );
  };

  const deleteIndividualWorkout = (workoutId: string) => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);
            saveWorkouts(updatedWorkouts);

            // Remove associated max records
            await removeMaxRecords(workoutId);

            Alert.alert("Success", "Workout deleted successfully");
          },
        },
      ]
    );
  };

  const clearAllWorkouts = () => {
    Alert.alert(
      "Clear All Workouts",
      `Are you sure you want to delete ALL ${workouts.length} stored workouts? This will permanently remove your entire workout history and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            saveWorkouts([]);

            // Clear all max records since all workouts are deleted
            try {
              await AsyncStorage.setItem("maxRecords", JSON.stringify([]));
            } catch (error) {
              console.error("Error clearing max records:", error);
            }

            setSelectedWorkout(null);
            setShowWorkoutHistory(false);
            Alert.alert("Success", "All workouts have been deleted");
          },
        },
      ]
    );
  };

  const cancelWorkout = () => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel this workout? Any exercises you've added will be lost.",
      [
        { text: "Keep Workout", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: () => {
            setIsWorkoutActive(false);
            setCurrentWorkout([]);
            setWorkoutStartTime(null);
            setIsMaxWorkout(false); // Reset max workout flag
            Alert.alert("Workout Cancelled", "Your workout has been cancelled");
          },
        },
      ]
    );
  };

  const saveMaxRecords = async (workout: WorkoutRecord) => {
    try {
      // Only save max records for non-cardio exercises
      const maxRecords = workout.exercises
        .filter((exercise) => !isCardioExercise(exercise.name))
        .map((exercise) => ({
          id: `${workout.id}-${exercise.id}`,
          exerciseName: exercise.name,
          weight: exercise.weight,
          reps: exercise.reps,
          sets: exercise.sets,
          date: workout.date,
          workoutId: workout.id,
        }));

      if (maxRecords.length > 0) {
        const existingMaxRecords = await AsyncStorage.getItem("maxRecords");
        const allMaxRecords = existingMaxRecords
          ? JSON.parse(existingMaxRecords)
          : [];

        const updatedMaxRecords = [...allMaxRecords, ...maxRecords];
        await AsyncStorage.setItem(
          "maxRecords",
          JSON.stringify(updatedMaxRecords)
        );
      }
    } catch (error) {
      console.error("Error saving max records:", error);
    }
  };

  const removeMaxRecords = async (workoutId: string) => {
    try {
      const existingMaxRecords = await AsyncStorage.getItem("maxRecords");
      if (existingMaxRecords) {
        const allMaxRecords = JSON.parse(existingMaxRecords);
        // Filter out max records associated with the deleted workout
        const updatedMaxRecords = allMaxRecords.filter(
          (record: any) => record.workoutId !== workoutId
        );
        await AsyncStorage.setItem(
          "maxRecords",
          JSON.stringify(updatedMaxRecords)
        );
      }
    } catch (error) {
      console.error("Error removing max records:", error);
    }
  };

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
      startButton: {
        backgroundColor: theme.success,
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
      },
      buttonText: {
        color: theme.buttonText,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "bold",
      },
      sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        color: theme.text,
      },
      workoutCard: {
        backgroundColor: theme.surface,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: "row",
        alignItems: "center",
      },
      workoutCardContent: {
        flex: 1,
        padding: 15,
      },
      workoutDate: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.text,
      },
      workoutDuration: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 5,
      },
      exerciseCount: {
        fontSize: 14,
        color: theme.textSecondary,
      },
      calorieInfo: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: "600",
        marginTop: 2,
      },
      activeWorkoutTitle: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
        color: theme.primary,
      },
      timer: {
        textAlign: "center",
        fontSize: 16,
        color: theme.textSecondary,
        marginBottom: 20,
      },
      addExerciseButton: {
        backgroundColor: theme.secondary,
        padding: 12,
        borderRadius: 8,
        flex: 1,
      },
      addSupersetButton: {
        backgroundColor: theme.accent,
        padding: 12,
        borderRadius: 8,
        flex: 1,
      },
      exerciseCard: {
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: 8,
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
      exerciseDetails: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 5,
      },
      finishButton: {
        backgroundColor: theme.error,
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
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
      modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
      },
      modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
      },
      cancelButton: {
        backgroundColor: theme.textSecondary,
      },
      addButton: {
        backgroundColor: theme.success,
      },
      historyButton: {
        backgroundColor: theme.primary,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
      },
      workoutTime: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
      },
      noWorkoutsText: {
        textAlign: "center",
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 20,
        fontStyle: "italic",
      },
      historyModalContent: {
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 15,
        width: "95%",
        maxWidth: 500,
        maxHeight: "80%",
      },
      workoutDetailsScroll: {
        maxHeight: 400,
      },
      workoutDetailsHeader: {
        backgroundColor: theme.background,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
      },
      workoutDetailsDate: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.text,
      },
      workoutDetailsTime: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 5,
      },
      workoutDetailsDuration: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 5,
      },
      calorieDetailsSection: {
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        borderLeftWidth: 3,
        borderLeftColor: theme.primary,
      },
      calorieDetailsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.primary,
        marginBottom: 5,
      },
      calorieDetailsMethod: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 2,
      },
      calorieDetailsAvgMET: {
        fontSize: 14,
        color: theme.textSecondary,
      },
      exercisesTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: theme.text,
      },
      exerciseDetailCard: {
        backgroundColor: theme.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
      },
      exerciseDetailName: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.text,
      },
      exerciseDetailInfo: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 5,
      },
      backToHistoryButton: {
        backgroundColor: theme.secondary,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
      },
      historyScroll: {
        maxHeight: 400,
      },
      historyWorkoutCard: {
        backgroundColor: theme.background,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
      },
      historyWorkoutDate: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.text,
      },
      historyWorkoutTime: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
      },
      historyWorkoutDuration: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 5,
      },
      historyCalorieInfo: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: "600",
        marginTop: 2,
      },
      noHistoryText: {
        textAlign: "center",
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 40,
        fontStyle: "italic",
      },
      closeHistoryButton: {
        backgroundColor: theme.textSecondary,
        padding: 15,
        borderRadius: 10,
        flex: 1,
      },
      generateButton: {
        backgroundColor: theme.accent,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
      },
      activeWorkoutButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 20,
      },
      cancelWorkoutButton: {
        backgroundColor: theme.error,
        padding: 12,
        borderRadius: 8,
        flex: 1,
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
        color: theme.buttonText,
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
      deleteExerciseButton: {
        backgroundColor: theme.error,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
      },
      deleteExerciseText: {
        color: theme.buttonText,
        fontSize: 18,
        fontWeight: "bold",
      },
      deleteWorkoutButton: {
        backgroundColor: theme.error,
        width: 35,
        height: 35,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        padding: 5,
      },
      deleteWorkoutText: {
        fontSize: 16,
      },
      workoutDetailsButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 20,
      },
      deleteWorkoutDetailButton: {
        backgroundColor: theme.error,
        padding: 12,
        borderRadius: 8,
        flex: 1,
      },
      historyModalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 20,
      },
      clearAllButton: {
        backgroundColor: theme.error,
        padding: 15,
        borderRadius: 10,
        flex: 1,
      },
      generateScrollView: {
        maxHeight: 400,
        marginBottom: 10,
      },
      singleButton: {
        flex: 1,
      },
      // New active workout layout styles
      activeWorkoutContainer: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
      },
      activeWorkoutHeader: {
        flexShrink: 0,
      },
      exercisesScrollView: {
        flex: 1,
        marginVertical: 10,
      },
      exercisesScrollContent: {
        paddingBottom: 20,
      },
      finishButtonContainer: {
        flexShrink: 0,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.textSecondary + "20",
      },
      inactiveWorkoutScrollView: {
        flex: 1,
      },
      // Max workout toggle styles
      maxWorkoutToggle: {
        marginTop: 15,
        marginBottom: 10,
      },
      maxToggleButton: {
        backgroundColor: theme.background,
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: theme.textSecondary,
        alignItems: "center",
      },
      maxToggleButtonActive: {
        backgroundColor: theme.error,
        borderColor: theme.error,
      },
      maxToggleText: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme.textSecondary,
      },
      maxToggleTextActive: {
        color: theme.buttonText,
      },
      maxWorkoutDescription: {
        fontSize: 12,
        color: theme.textSecondary,
        textAlign: "center",
        marginTop: 5,
        fontStyle: "italic",
      },
    });

  const styles = createStyles(theme);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
      <Text style={styles.title}>Fitness Tracker</Text>

      {!isWorkoutActive ? (
        <ScrollView style={styles.inactiveWorkoutScrollView}>
          <View>
            <Pressable style={styles.startButton} onPress={startWorkout}>
              <Text style={styles.buttonText}>Start New Workout</Text>
            </Pressable>

            <Pressable
              style={styles.historyButton}
              onPress={() => setShowWorkoutHistory(true)}
            >
              <Text style={styles.buttonText}>View Workout History</Text>
            </Pressable>

            <Pressable
              style={styles.generateButton}
              onPress={() => setShowGenerateWorkout(true)}
            >
              <Text style={styles.buttonText}>Generate Workout</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {getFilteredWorkouts()
              .slice(0, 3)
              .map((workout) => (
                <View key={workout.id} style={styles.workoutCard}>
                  <Pressable
                    style={styles.workoutCardContent}
                    onPress={() => {
                      setSelectedWorkout(workout);
                      setShowWorkoutHistory(true);
                    }}
                  >
                    <Text style={styles.workoutDate}>
                      {formatDate(workout.date)}
                    </Text>
                    <Text style={styles.workoutTime}>
                      {getWeeksAgo(workout.date)}
                    </Text>
                    <Text style={styles.workoutDuration}>
                      {workout.duration} minutes
                    </Text>
                    <Text style={styles.exerciseCount}>
                      {workout.exercises.length} exercises
                    </Text>
                    {workout.calorieData && (
                      <Text style={styles.calorieInfo}>
                        {workout.calorieData.totalCalories} calories burned
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.deleteWorkoutButton}
                    onPress={() => deleteIndividualWorkout(workout.id)}
                  >
                    <Text style={styles.deleteWorkoutText}>🗑️</Text>
                  </Pressable>
                </View>
              ))}

            {getFilteredWorkouts().length === 0 && (
              <Text style={styles.noWorkoutsText}>No recent workouts</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.activeWorkoutContainer}>
          <View style={styles.activeWorkoutHeader}>
            <Text style={styles.activeWorkoutTitle}>Active Workout</Text>
            <Text style={styles.timer}>
              Started: {workoutStartTime?.toLocaleTimeString()}
            </Text>

            <View style={styles.activeWorkoutButtons}>
              <Pressable
                style={styles.addExerciseButton}
                onPress={() => setShowAddExercise(true)}
              >
                <Text style={styles.buttonText}>Add Exercise</Text>
              </Pressable>

              <Pressable
                style={styles.addSupersetButton}
                onPress={() => setShowGenerateWorkout(true)}
              >
                <Text style={styles.buttonText}>Add Superset</Text>
              </Pressable>

              <Pressable
                style={styles.cancelWorkoutButton}
                onPress={cancelWorkout}
              >
                <Text style={styles.buttonText}>Cancel Workout</Text>
              </Pressable>
            </View>

            {/* Max Workout Toggle */}
            <View style={styles.maxWorkoutToggle}>
              <Pressable
                style={[
                  styles.maxToggleButton,
                  isMaxWorkout && styles.maxToggleButtonActive,
                ]}
                onPress={() => setIsMaxWorkout(!isMaxWorkout)}
              >
                <Text
                  style={[
                    styles.maxToggleText,
                    isMaxWorkout && styles.maxToggleTextActive,
                  ]}
                >
                  {isMaxWorkout ? "🔥 MAX WORKOUT" : "Mark as Max Workout"}
                </Text>
              </Pressable>
              {isMaxWorkout && (
                <Text style={styles.maxWorkoutDescription}>
                  This workout will be tracked for progression analysis
                </Text>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.exercisesScrollView}
            contentContainerStyle={styles.exercisesScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {currentWorkout.map((exercise) => {
              // Use CardioExerciseInput for cardio exercises
              if (isCardioExercise(exercise.name)) {
                return (
                  <CardioExerciseInput
                    key={exercise.id}
                    exercise={exercise}
                    onExerciseChange={(updatedExercise) => {
                      const updatedExercises = currentWorkout.map((ex) =>
                        ex.id === exercise.id ? updatedExercise : ex
                      );
                      setCurrentWorkout(updatedExercises);
                    }}
                    onRemove={() => deleteExerciseFromWorkout(exercise.id)}
                  />
                );
              }

              // Use regular display for non-cardio exercises
              return (
                <Pressable
                  key={exercise.id}
                  style={styles.exerciseCard}
                  onPress={() => openEditExercise(exercise)}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets} sets × {exercise.reps} reps @{" "}
                      {exercise.weight}lbs
                    </Text>
                  </View>
                  <Pressable
                    style={styles.deleteExerciseButton}
                    onPress={() => deleteExerciseFromWorkout(exercise.id)}
                  >
                    <Text style={styles.deleteExerciseText}>×</Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.finishButtonContainer}>
            <Pressable style={styles.finishButton} onPress={finishWorkout}>
              <Text style={styles.buttonText}>Finish Workout</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Modal visible={showAddExercise} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>

            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              value={exerciseName}
              onChangeText={setExerciseName}
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Sets"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Weight (lbs)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddExercise(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.addButton]}
                onPress={addExercise}
              >
                <Text style={styles.buttonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWorkoutHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalContent}>
            <Text style={styles.modalTitle}>
              {selectedWorkout ? "Workout Details" : "Workout History"}
            </Text>

            {selectedWorkout ? (
              <ScrollView style={styles.workoutDetailsScroll}>
                <View style={styles.workoutDetailsHeader}>
                  <Text style={styles.workoutDetailsDate}>
                    {formatDate(selectedWorkout.date)}
                  </Text>
                  <Text style={styles.workoutDetailsTime}>
                    {getWeeksAgo(selectedWorkout.date)}
                  </Text>
                  <Text style={styles.workoutDetailsDuration}>
                    Duration: {selectedWorkout.duration} minutes
                  </Text>
                  {selectedWorkout.calorieData && (
                    <View style={styles.calorieDetailsSection}>
                      <Text style={styles.calorieDetailsTitle}>
                        Calories Burned:{" "}
                        {selectedWorkout.calorieData.totalCalories}
                      </Text>
                      <Text style={styles.calorieDetailsMethod}>
                        Calculation:{" "}
                        {selectedWorkout.calorieData.calculationMethod ===
                        "complete_profile"
                          ? "Personalized"
                          : "Default values"}
                      </Text>
                      <Text style={styles.calorieDetailsAvgMET}>
                        Average MET: {selectedWorkout.calorieData.averageMET}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.exercisesTitle}>Exercises:</Text>
                {selectedWorkout.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.exerciseDetailCard}>
                    <Text style={styles.exerciseDetailName}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseDetailInfo}>
                      {exercise.sets} sets × {exercise.reps} reps @{" "}
                      {exercise.weight}lbs
                    </Text>
                  </View>
                ))}

                <View style={styles.workoutDetailsButtons}>
                  <Pressable
                    style={styles.backToHistoryButton}
                    onPress={() => setSelectedWorkout(null)}
                  >
                    <Text style={styles.buttonText}>Workout History</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteWorkoutDetailButton}
                    onPress={() => deleteWorkout(selectedWorkout.id)}
                  >
                    <Text style={styles.buttonText}>Delete Workout</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <ScrollView style={styles.historyScroll}>
                {getFilteredWorkouts().map((workout) => (
                  <View key={workout.id} style={styles.historyWorkoutCard}>
                    <Pressable
                      style={styles.workoutCardContent}
                      onPress={() => setSelectedWorkout(workout)}
                    >
                      <Text style={styles.historyWorkoutDate}>
                        {formatDate(workout.date)}
                      </Text>
                      <Text style={styles.historyWorkoutTime}>
                        {getWeeksAgo(workout.date)}
                      </Text>
                      <Text style={styles.historyWorkoutDuration}>
                        {workout.duration} minutes • {workout.exercises.length}{" "}
                        exercises
                      </Text>
                      {workout.calorieData && (
                        <Text style={styles.historyCalorieInfo}>
                          {workout.calorieData.totalCalories} calories burned
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.deleteWorkoutButton}
                      onPress={() => deleteWorkout(workout.id)}
                    >
                      <Text style={styles.deleteWorkoutText}>🗑️</Text>
                    </Pressable>
                  </View>
                ))}

                {getFilteredWorkouts().length === 0 && (
                  <Text style={styles.noHistoryText}>No workouts found</Text>
                )}
              </ScrollView>
            )}

            <View style={styles.historyModalButtons}>
              {!selectedWorkout && workouts.length > 0 && (
                <Pressable
                  style={styles.clearAllButton}
                  onPress={clearAllWorkouts}
                >
                  <Text style={styles.buttonText}>Clear All Workouts</Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.closeHistoryButton,
                  selectedWorkout && styles.singleButton,
                ]}
                onPress={() => {
                  setShowWorkoutHistory(false);
                  setSelectedWorkout(null);
                }}
              >
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Workout Modal */}
      <Modal visible={showGenerateWorkout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isWorkoutActive ? "Add Superset" : "Generate Workout"}
            </Text>

            <ScrollView
              style={styles.generateScrollView}
              showsVerticalScrollIndicator={true}
            >
              {categories.map((category) => {
                const count = getExercisesByCategory(category).length;
                return (
                  <View key={category} style={styles.generateOption}>
                    <Text style={styles.generateCategoryTitle}>
                      {category} ({count} exercises available)
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
                            isWorkoutActive
                              ? addGeneratedExercises(category, exerciseCount)
                              : generateWorkout(category, exerciseCount)
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

      {/* Workout Summary Modal with Error Boundary */}
      {showWorkoutSummary && workoutSummaryData && calorieCalculationResult && (
        <CalorieCalculationErrorBoundary
          maxRetries={2}
          retryDelay={1000}
          onError={(error, errorInfo) => {
            console.error("Error in WorkoutSummaryModal:", error, errorInfo);
            ErrorLogger.log(
              createErrorFromException(error, "WorkoutSummaryModal")
            );
          }}
        >
          <WorkoutSummaryModal
            visible={showWorkoutSummary}
            onClose={() => setShowWorkoutSummary(false)}
            workoutData={workoutSummaryData}
            calorieResult={calorieCalculationResult}
            userProfile={userProfile}
          />
        </CalorieCalculationErrorBoundary>
      )}
      {/* Edit Exercise Modal */}
      <Modal visible={showEditExercise} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Exercise</Text>

            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              value={exerciseName}
              onChangeText={setExerciseName}
              editable={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Sets"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Weight (lbs)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditExercise(false);
                  setEditingExercise(null);
                  setExerciseName("");
                  setSets("");
                  setReps("");
                  setWeight("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.addButton]}
                onPress={updateExercise}
              >
                <Text style={styles.buttonText}>Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}
