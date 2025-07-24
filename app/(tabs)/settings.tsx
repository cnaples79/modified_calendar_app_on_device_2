import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A simple settings screen which exposes a toggle for enabling or
 * disabling dark mode. The screen reads the current theme from
 * ThemeContext and writes changes back via the toggleTheme function. All
 * colours and text styles are derived from the active theme ensuring
 * consistency across light and dark appearances.
 */
export default function SettingsScreen() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <View style={styles.row}> 
        <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.userMessageBackground, false: '#767577' }}
          thumbColor={isDark ? colors.userMessageBackground : '#f4f3f4'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
  },
});