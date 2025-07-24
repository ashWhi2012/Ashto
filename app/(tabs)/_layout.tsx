import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

//File is taking care of aesthetically organizing the screen and
//providing a way to navigate between screens.

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        headerStyle: {
          backgroundColor: theme.surface,
        },
        // headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.textSecondary + "20",
        },
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          //unmountOnBlur: true,
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name={focused ? "history" : "history"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          //unmountOnBlur: true,
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name={focused ? "gear" : "gear"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="workoutTypes"
        options={{
          //unmountOnBlur: true,
          title: "Workouts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="barbell-outline" size={32} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
