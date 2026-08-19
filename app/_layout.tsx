import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { LogBox } from 'react-native';
import { color } from '../src/theme';

// The demo runs on a debug build; hide the on-screen warning overlay so it
// never covers the UI. (Dev-only; no effect in a release build.)
if (__DEV__) LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="transitions"
          options={{
            headerShown: true,
            title: 'Transitions',
            headerStyle: { backgroundColor: color.bg },
            headerTintColor: color.text1,
            headerTitleStyle: { fontFamily: 'SpaceGrotesk_700Bold' },
          }}
        />
      </Stack>
    </>
  );
}
