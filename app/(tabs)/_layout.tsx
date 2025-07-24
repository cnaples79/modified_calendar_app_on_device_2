import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  // Obtain the current theme to apply dynamic tint colours. When in dark
  // mode we reuse the primary accent colour (userMessageBackground) for
  // the active tab tint. This keeps the tab bar consistent with the
  // overall design language defined in ThemeContext.
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.userMessageBackground,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: { backgroundColor: colors.cardBackground, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="comment" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
