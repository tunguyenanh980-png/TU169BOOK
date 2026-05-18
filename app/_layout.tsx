import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="detailscreen" />
      <Stack.Screen name="loginscreen" />
      <Stack.Screen name="settingscreen" />
      <Stack.Screen name="profilescreen" /> 
    </Stack>
  );
}