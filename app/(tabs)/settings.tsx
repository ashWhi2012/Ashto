import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

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
}

export const THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light Mode',
    primary: '#4CAF50',
    secondary: '#2196F3',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    accent: '#FF9800',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primary: '#66BB6A',
    secondary: '#42A5F5',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    accent: '#FFB74D',
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350'
  },
  {
    id: 'purple-gold',
    name: 'Purple & Gold',
    primary: '#9C27B0',
    secondary: '#FFD700',
    background: '#F3E5F5',
    surface: '#FFFFFF',
    text: '#4A148C',
    textSecondary: '#7B1FA2',
    accent: '#FFD700',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  },
  {
    id: 'christmas',
    name: 'Christmas',
    primary: '#D32F2F',
    secondary: '#388E3C',
    background: '#FFEBEE',
    surface: '#FFFFFF',
    text: '#B71C1C',
    textSecondary: '#C62828',
    accent: '#FFD700',
    success: '#388E3C',
    warning: '#FF9800',
    error: '#D32F2F'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '#0277BD',
    secondary: '#00ACC1',
    background: '#E1F5FE',
    surface: '#FFFFFF',
    text: '#01579B',
    textSecondary: '#0288D1',
    accent: '#00BCD4',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primary: '#FF5722',
    secondary: '#FF9800',
    background: '#FFF3E0',
    surface: '#FFFFFF',
    text: '#BF360C',
    textSecondary: '#E64A19',
    accent: '#FFD54F',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#2E7D32',
    secondary: '#558B2F',
    background: '#E8F5E8',
    surface: '#FFFFFF',
    text: '#1B5E20',
    textSecondary: '#2E7D32',
    accent: '#8BC34A',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    primary: '#1A237E',
    secondary: '#303F9F',
    background: '#E8EAF6',
    surface: '#FFFFFF',
    text: '#0D47A1',
    textSecondary: '#1565C0',
    accent: '#536DFE',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  }
];

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const saveTheme = async (newTheme: Theme) => {
    try {
      await setTheme(newTheme);
      Alert.alert('Theme Changed', `Switched to ${newTheme.name} theme!`);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const resetToDefault = () => {
    Alert.alert(
      'Reset Theme',
      'Reset to Light Mode theme?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => saveTheme(THEMES[0])
        }
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
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
                theme.id === themeOption.id && styles.selectedThemeCard
              ]}
              onPress={() => saveTheme(themeOption)}
            >
              <View style={styles.themePreview}>
                <View style={[styles.colorSwatch, { backgroundColor: themeOption.primary }]} />
                <View style={[styles.colorSwatch, { backgroundColor: themeOption.secondary }]} />
                <View style={[styles.colorSwatch, { backgroundColor: themeOption.accent }]} />
              </View>
              <Text style={[
                styles.themeName,
                theme.id === themeOption.id && styles.selectedThemeName
              ]}>
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
          <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
            Today • 45 minutes
          </Text>
          <View style={styles.previewButtons}>
            <View style={[styles.previewButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.previewButtonText}>Primary</Text>
            </View>
            <View style={[styles.previewButton, { backgroundColor: theme.secondary }]}>
              <Text style={styles.previewButtonText}>Secondary</Text>
            </View>
            <View style={[styles.previewButton, { backgroundColor: theme.accent }]}>
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
        <Text style={styles.sectionTitle}>About Themes</Text>
        <Text style={styles.aboutText}>
          Themes change the color scheme throughout the entire app. Your selected theme will be saved and applied every time you open the app.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: theme.text
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15
  },
  themeCard: {
    width: '47%',
    backgroundColor: theme.surface,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  selectedThemeCard: {
    borderColor: theme.primary,
    borderWidth: 3
  },
  themePreview: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 5
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10
  },
  themeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center'
  },
  selectedThemeName: {
    color: theme.primary
  },
  selectedIndicator: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: 'bold',
    marginTop: 5
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  previewSubtitle: {
    fontSize: 14,
    marginBottom: 15
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 10
  },
  previewButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1
  },
  previewButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold'
  },
  resetButton: {
    backgroundColor: theme.error,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  aboutText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20
  }
});