import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { UserProfileProvider } from "../contexts/UserProfileContext";

function ThemedRootLayout() {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false}}/>
        <Stack.Screen name="+not-found" options = {{title: "Fallback"}} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProfileProvider>
        <ThemedRootLayout />
      </UserProfileProvider>
    </ThemeProvider>
  )
}
