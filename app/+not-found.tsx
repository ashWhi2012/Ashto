import * as React from "react";
import { StyleSheet, View } from "react-native";
// import {NavigationContainer} from '@react-navigation/native';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { Link, Stack } from "expo-router";

export default function NotFoundScreen() {
  return (
    <>
      {/* I think the epmty prop symbols - <></> - are
        needed here because of the Stack.Screen prop being
        outside of <View></View>. */}
      <Stack.Screen
        options={{ title: "Oops! Not Found", headerTitleAlign: "center" }}
      />
      <View style={styles.container}>
        <Link href="/(tabs)/notes" style={styles.button}>
          Go Back to Home screen!
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#fff",
  },
});
