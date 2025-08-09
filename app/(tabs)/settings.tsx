import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { AgeInput } from '../../components/profile/AgeInput';
import { HeightInput } from '../../components/profile/HeightInput';
import { SexSelector } from '../../components/profile/SexSelector';
import { WeightInput } from '../../components/profile/WeightInput';
import { useTheme } from "../../contexts/ThemeContext";
import { useUserProfile } from '../../contexts/UserProfileContext';
import { UserProfile } from '../../utils/calorieCalculator';


export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  buttonText: string;
}

export const THEMES: Theme[] = [
  {
    id: "light",
    name: "Light Mode",
    primary: "#4CAF50",
    secondary: "#2196F3",
    background: "#f5f5f5",
    surface: "#ffffff",
    text: "#333333",
    textSecondary: "#666666",
    accent: "#FF9800",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#f44336",
    buttonText: "#FFFFFF",
  },
  {
    id: "dark",
    name: "Dark Mode",
    primary: "#66BB6A",
    secondary: "#42A5F5",
    background: "#121212",
    surface: "#1E1E1E",
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    accent: "#FFB74D",
    success: "#66BB6A",
    warning: "#FFB74D",
    error: "#EF5350",
    buttonText: "#FFFFFF",
  },
  {
    id: "purple-gold",
    name: "Purple & Gold",
    primary: "#9C27B0",
    secondary: "#FFD700",
    background: "#F3E5F5",
    surface: "#FFFFFF",
    text: "#4A148C",
    textSecondary: "#7B1FA2",
    accent: "#FFD700",
    success: "#8BC34A",
    warning: "#FFC107",
    error: "#E91E63",
    buttonText: "#FFFFFF",
  },
  {
    id: "christmas",
    name: "Christmas",
    primary: "#D32F2F",
    secondary: "#388E3C",
    background: "#FFEBEE",
    surface: "#FFFFFF",
    text: "#B71C1C",
    textSecondary: "#C62828",
    accent: "#FFD700",
    success: "#388E3C",
    warning: "#FFC107",
    error: "#D32F2F",
    buttonText: "#FFFFFF",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    primary: "#0277BD",
    secondary: "#00ACC1",
    background: "#E1F5FE",
    surface: "#FFFFFF",
    text: "#01579B",
    textSecondary: "#0288D1",
    accent: "#00BCD4",
    success: "#26A69A",
    warning: "#FFA726",
    error: "#EF5350",
    buttonText: "#FFFFFF",
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#FF5722",
    secondary: "#FF9800",
    background: "#FFF3E0",
    surface: "#FFFFFF",
    text: "#BF360C",
    textSecondary: "#E64A19",
    accent: "#FFD54F",
    success: "#FF8A65",
    warning: "#FFB74D",
    error: "#F4511E",
    buttonText: "#FFFFFF",
  },
  {
    id: "forest",
    name: "Forest Green",
    primary: "#2E7D32",
    secondary: "#558B2F",
    background: "#E8F5E8",
    surface: "#FFFFFF",
    text: "#1B5E20",
    textSecondary: "#2E7D32",
    accent: "#8BC34A",
    success: "#66BB6A",
    warning: "#FFA726",
    error: "#EF5350",
    buttonText: "#FFFFFF",
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    primary: "#1A237E",
    secondary: "#303F9F",
    background: "#E8EAF6",
    surface: "#FFFFFF",
    text: "#0D47A1",
    textSecondary: "#1565C0",
    accent: "#536DFE",
    success: "#42A5F5",
    warning: "#FFA726",
    error: "#EF5350",
    buttonText: "#FFFFFF",
  },
];

const DEFAULT_CATEGORIES = [
  "Arms",
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Core",
  "Cardio",
];

const WORKOUT_RETENTION_OPTIONS = [
  { label: "1 Week", weeks: 1 },
  { label: "2 Weeks", weeks: 2 },
  { label: "4 Weeks", weeks: 4 },
  { label: "8 Weeks", weeks: 8 },
  { label: "12 Weeks", weeks: 12 },
  { label: "6 Months", weeks: 26 },
  { label: "1 Year", weeks: 52 },
  { label: "Forever", weeks: -1 },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { 
    userProfile, 
    setUserProfile, 
    profileCompleteness, 
    validationState,
    getDefaultProfile 
  } = useUserProfile();
  
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [workoutRetentionWeeks, setWorkoutRetentionWeeks] = useState(4);
  
  // Personal information section state
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>(() => 
    userProfile || getDefaultProfile()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCategories();
    loadWorkoutRetention();
  }, []);

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

  const saveCategories = async (newCategories: string[]) => {
    try {
      await AsyncStorage.setItem(
        "exerciseCategories",
        JSON.stringify(newCategories)
      );
      setCategories(newCategories);
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  };

  const saveWorkoutRetention = async (weeks: number) => {
    try {
      await AsyncStorage.setItem(
        "workoutRetentionWeeks",
        JSON.stringify(weeks)
      );
      setWorkoutRetentionWeeks(weeks);
      const option = WORKOUT_RETENTION_OPTIONS.find(
        (opt) => opt.weeks === weeks
      );
      Alert.alert(
        "Setting Updated",
        `Workout history will now show ${
          option?.label.toLowerCase() || "selected period"
        }`
      );
    } catch (error) {
      console.error("Error saving workout retention:", error);
    }
  };

  const saveTheme = async (newTheme: Theme) => {
    try {
      await setTheme(newTheme);
      Alert.alert("Theme Changed", `Switched to ${newTheme.name} theme!`);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const resetToDefault = () => {
    Alert.alert("Reset Theme", "Reset to Light Mode theme?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => saveTheme(THEMES[0]),
      },
    ]);
  };

  // Profile save functionality
  const handleProfileSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Update the profile data with current timestamp
      const updatedProfile = {
        ...profileData,
        updatedAt: new Date().toISOString(),
      };
      
      await setUserProfile(updatedProfile);
      setProfileData(updatedProfile);
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Profile field update handlers
  const handleAgeChange = (age: number) => {
    setProfileData(prev => ({ ...prev, age }));
  };

  const handleWeightChange = (weight: number) => {
    setProfileData(prev => ({ ...prev, weight }));
  };

  const handleWeightUnitChange = (unit: 'kg' | 'lbs') => {
    setProfileData(prev => ({ ...prev, weightUnit: unit }));
  };

  const handleHeightChange = (height: number) => {
    setProfileData(prev => ({ ...prev, height }));
  };

  const handleHeightUnitChange = (unit: 'cm' | 'ft_in') => {
    setProfileData(prev => ({ ...prev, heightUnit: unit }));
  };

  const handleSexChange = (sex: 'male' | 'female' | 'other') => {
    setProfileData(prev => ({ ...prev, sex }));
  };

  const addCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    if (categories.includes(categoryName.trim())) {
      Alert.alert("Error", "Category already exists");
      return;
    }

    const newCategories = [...categories, categoryName.trim()];
    saveCategories(newCategories);
    setCategoryName("");
    setShowCategoryModal(false);
    Alert.alert("Success", "Category added successfully!");
  };

  const editCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setCategoryName(oldName);
    setIsEditing(true);
    setShowCategoryModal(true);
  };

  const updateCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    if (
      categoryName.trim() !== editingCategory &&
      categories.includes(categoryName.trim())
    ) {
      Alert.alert("Error", "Category already exists");
      return;
    }

    const newCategories = categories.map((cat) =>
      cat === editingCategory ? categoryName.trim() : cat
    );
    saveCategories(newCategories);
    setCategoryName("");
    setEditingCategory(null);
    setIsEditing(false);
    setShowCategoryModal(false);
    Alert.alert("Success", "Category updated successfully!");
  };

  const deleteCategory = (categoryToDelete: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${categoryToDelete}"? This will also remove all exercises in this category.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newCategories = categories.filter(
              (cat) => cat !== categoryToDelete
            );
            saveCategories(newCategories);
            Alert.alert("Success", "Category deleted successfully!");
          },
        },
      ]
    );
  };

  const resetCategories = () => {
    Alert.alert(
      "Reset Categories",
      "Reset to default exercise categories? This will remove all custom categories.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            saveCategories(DEFAULT_CATEGORIES);
            Alert.alert("Success", "Categories reset to defaults!");
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Personal Information Section */}
      <View style={styles.section}>
        <Pressable 
          style={styles.sectionHeader}
          onPress={() => setShowPersonalInfo(!showPersonalInfo)}
          testID="personal-info-toggle"
        >
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionHeaderRight}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{profileCompleteness}%</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${profileCompleteness}%`, backgroundColor: theme.primary }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.expandIcon}>
              {showPersonalInfo ? '▼' : '▶'}
            </Text>
          </View>
        </Pressable>
        
        <Text style={styles.sectionDescription}>
          Manage your personal information for calorie calculations
        </Text>

        {showPersonalInfo && (
          <View style={styles.personalInfoContent} testID="personal-info-content">
            <AgeInput
              value={profileData.age}
              onValueChange={handleAgeChange}
              testID="settings-age-input"
            />
            
            <WeightInput
              value={profileData.weight}
              unit={profileData.weightUnit}
              onValueChange={handleWeightChange}
              onUnitChange={handleWeightUnitChange}
              testID="settings-weight-input"
            />
            
            <HeightInput
              value={profileData.height}
              unit={profileData.heightUnit}
              onValueChange={handleHeightChange}
              onUnitChange={handleHeightUnitChange}
              testID="settings-height-input"
            />
            
            <SexSelector
              value={profileData.sex}
              onValueChange={handleSexChange}
              testID="settings-sex-selector"
            />

            {/* Save Button */}
            <Pressable 
              style={[
                styles.saveProfileButton,
                isSaving && styles.saveProfileButtonDisabled
              ]}
              onPress={handleProfileSave}
              disabled={isSaving}
              testID="save-profile-button"
            >
              <Text style={styles.saveProfileButtonText}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Text>
            </Pressable>

            {/* Success/Error Messages */}
            {saveMessage && (
              <View 
                style={[
                  styles.messageContainer,
                  saveMessage.type === 'success' ? styles.successMessage : styles.errorMessage
                ]}
                testID={`save-message-${saveMessage.type}`}
              >
                <Text style={styles.messageText}>{saveMessage.text}</Text>
              </View>
            )}

            {/* Validation Errors */}
            {!validationState.isValid && validationState.errors.length > 0 && (
              <View style={styles.validationContainer} testID="validation-errors">
                <Text style={styles.validationTitle}>Please fix the following:</Text>
                {validationState.errors.map((error, index) => (
                  <Text key={index} style={styles.validationError}>• {error}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Selection</Text>
        <Text style={styles.sectionDescription}>
          Choose your preferred color theme for the app
        </Text>

        <View style={styles.themeGrid}>
          {THEMES.map((themeOption) => (
            <Pressable
              key={themeOption.id}
              style={[
                styles.themeCard,
                theme.id === themeOption.id && styles.selectedThemeCard,
              ]}
              onPress={() => saveTheme(themeOption)}
            >
              <View style={styles.themePreview}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: themeOption.primary },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: themeOption.secondary },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: themeOption.accent },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.themeName,
                  theme.id === themeOption.id && styles.selectedThemeName,
                ]}
              >
                {themeOption.name}
              </Text>
              {theme.id === themeOption.id && (
                <Text style={styles.selectedIndicator}>✓ Active</Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Preview</Text>
        <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.previewTitle, { color: theme.text }]}>
            Sample Workout Card
          </Text>
          <Text
            style={[styles.previewSubtitle, { color: theme.textSecondary }]}
          >
            Today • 45 minutes
          </Text>
          <View style={styles.previewButtons}>
            <View
              style={[styles.previewButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.previewButtonText}>Primary</Text>
            </View>
            <View
              style={[
                styles.previewButton,
                { backgroundColor: theme.secondary },
              ]}
            >
              <Text style={styles.previewButtonText}>Secondary</Text>
            </View>
            <View
              style={[styles.previewButton, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.previewButtonText}>Accent</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.resetButton} onPress={resetToDefault}>
          <Text style={styles.resetButtonText}>Reset to Default Theme</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercise Categories</Text>
        <Text style={styles.sectionDescription}>
          Manage your workout exercise categories
        </Text>

        <Pressable
          style={styles.addCategoryButton}
          onPress={() => {
            setIsEditing(false);
            setCategoryName("");
            setShowCategoryModal(true);
          }}
        >
          <Text style={styles.buttonText}>Add New Category</Text>
        </Pressable>

        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <View key={category} style={styles.categoryCard}>
              <Text style={styles.categoryName}>{category}</Text>
              <View style={styles.categoryActions}>
                <Pressable
                  style={styles.editCategoryButton}
                  onPress={() => editCategory(category)}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteCategoryButton}
                  onPress={() => deleteCategory(category)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.resetCategoriesButton}
          onPress={resetCategories}
        >
          <Text style={styles.resetButtonText}>
            Reset to Default Categories
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout History Retention</Text>
        <Text style={styles.sectionDescription}>
          Choose how long to keep your workout history visible
        </Text>

        <View style={styles.retentionGrid}>
          {WORKOUT_RETENTION_OPTIONS.map((option) => (
            <Pressable
              key={option.weeks}
              style={[
                styles.retentionCard,
                workoutRetentionWeeks === option.weeks &&
                  styles.selectedRetentionCard,
              ]}
              onPress={() => saveWorkoutRetention(option.weeks)}
            >
              <Text
                style={[
                  styles.retentionLabel,
                  workoutRetentionWeeks === option.weeks &&
                    styles.selectedRetentionLabel,
                ]}
              >
                {option.label}
              </Text>
              {workoutRetentionWeeks === option.weeks && (
                <Text style={styles.selectedIndicator}>✓ Active</Text>
              )}
            </Pressable>
          ))}
        </View>

        <Text style={styles.retentionNote}>
          Current setting:{" "}
          {WORKOUT_RETENTION_OPTIONS.find(
            (opt) => opt.weeks === workoutRetentionWeeks
          )?.label || "4 Weeks"}
          {workoutRetentionWeeks === -1
            ? " - All workouts will be kept"
            : ` - Workouts older than ${workoutRetentionWeeks} week${
                workoutRetentionWeeks === 1 ? "" : "s"
              } will be hidden`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Themes</Text>
        <Text style={styles.aboutText}>
          Themes change the color scheme throughout the entire app. Your
          selected theme will be saved and applied every time you open the app.
        </Text>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Category" : "Add New Category"}
            </Text>

            <TextInput
              style={styles.categoryInput}
              placeholder="Category name"
              value={categoryName}
              onChangeText={setCategoryName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCategoryModal(false);
                  setCategoryName("");
                  setEditingCategory(null);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={isEditing ? updateCategory : addCategory}
              >
                <Text style={styles.buttonText}>
                  {isEditing ? "Update" : "Add"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const createStyles = (theme: Theme) =>
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
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 10,
      color: theme.text,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 20,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 15,
    },
    themeCard: {
      width: "47%",
      backgroundColor: theme.surface,
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selectedThemeCard: {
      borderColor: theme.primary,
      borderWidth: 3,
    },
    themePreview: {
      flexDirection: "row",
      marginBottom: 10,
      gap: 5,
    },
    colorSwatch: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    themeName: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
    },
    selectedThemeName: {
      color: theme.primary,
    },
    selectedIndicator: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: "bold",
      marginTop: 5,
    },
    previewCard: {
      padding: 20,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 5,
    },
    previewSubtitle: {
      fontSize: 14,
      marginBottom: 15,
    },
    previewButtons: {
      flexDirection: "row",
      gap: 10,
    },
    previewButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 8,
      flex: 1,
    },
    previewButtonText: {
      color: theme.buttonText,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "bold",
    },
    resetButton: {
      backgroundColor: theme.error,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    resetButtonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: "bold",
    },
    aboutText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    addCategoryButton: {
      backgroundColor: theme.success,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 20,
    },
    categoriesContainer: {
      marginBottom: 20,
    },
    categoryCard: {
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
    categoryName: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
      flex: 1,
    },
    categoryActions: {
      flexDirection: "row",
      gap: 10,
    },
    editCategoryButton: {
      backgroundColor: theme.secondary,
      width: 35,
      height: 35,
      borderRadius: 17.5,
      justifyContent: "center",
      alignItems: "center",
    },
    deleteCategoryButton: {
      backgroundColor: theme.error,
      width: 35,
      height: 35,
      borderRadius: 17.5,
      justifyContent: "center",
      alignItems: "center",
    },
    actionButtonText: {
      fontSize: 16,
    },
    resetCategoriesButton: {
      backgroundColor: theme.warning,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
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
    categoryInput: {
      borderWidth: 1,
      borderColor: theme.textSecondary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
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
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: theme.textSecondary,
    },
    saveButton: {
      backgroundColor: theme.success,
    },
    buttonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: "bold",
    },
    retentionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 15,
    },
    retentionCard: {
      width: "47%",
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: 10,
    },
    selectedRetentionCard: {
      borderColor: theme.primary,
      borderWidth: 3,
    },
    retentionLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
    },
    selectedRetentionLabel: {
      color: theme.primary,
    },
    retentionNote: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 10,
    },
    // Personal Information Section Styles
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    progressText: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme.text,
      minWidth: 30,
    },
    progressBar: {
      width: 60,
      height: 8,
      backgroundColor: theme.textSecondary + "30",
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
    },
    expandIcon: {
      fontSize: 16,
      color: theme.textSecondary,
      fontWeight: "bold",
    },
    personalInfoContent: {
      marginTop: 10,
    },
    saveProfileButton: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 20,
      marginBottom: 10,
    },
    saveProfileButtonDisabled: {
      backgroundColor: theme.textSecondary,
      opacity: 0.6,
    },
    saveProfileButtonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: "bold",
    },
    messageContainer: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    successMessage: {
      backgroundColor: theme.success + "20",
      borderColor: theme.success,
      borderWidth: 1,
    },
    errorMessage: {
      backgroundColor: theme.error + "20",
      borderColor: theme.error,
      borderWidth: 1,
    },
    messageText: {
      fontSize: 14,
      textAlign: "center",
      fontWeight: "500",
    },
    validationContainer: {
      backgroundColor: theme.error + "10",
      padding: 12,
      borderRadius: 8,
      borderColor: theme.error,
      borderWidth: 1,
      marginTop: 10,
    },
    validationTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.error,
      marginBottom: 8,
    },
    validationError: {
      fontSize: 12,
      color: theme.error,
      marginBottom: 4,
    },te: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 10,
    },
  });
