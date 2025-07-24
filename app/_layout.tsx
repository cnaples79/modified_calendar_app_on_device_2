import { Stack } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  // Wrap the navigation stack in our ThemeProvider so that all child
  // components have access to theme values and can respond to changes.
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event-modal" options={{ presentation: 'modal', title: 'Add/Edit Event' }} />
        <Stack.Screen name="modal/event-details" options={{ presentation: 'modal', title: 'Event Details' }} />
      </Stack>
    </ThemeProvider>
  );
}

