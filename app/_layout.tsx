import { Stack } from "expo-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UserProfileProvider } from "../contexts/UserProfileContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProfileProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false}}/>
          <Stack.Screen name="+not-found" options = {{title: "Fallback"}} />
        </Stack>
      </UserProfileProvider>
    </ThemeProvider>
  )
}
