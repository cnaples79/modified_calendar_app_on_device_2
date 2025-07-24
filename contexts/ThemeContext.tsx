import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * A simple theme context that exposes whether the dark theme is currently
 * enabled along with a toggle function. The context also provides a
 * collection of color values that are consumed by the UI to style
 * components consistently. If you need to add more tokens for future
 * screens just append them to the lightColors/darkColors objects below
 * and include them in the returned value.
 */
export type ThemeColors = {
  background: string;
  text: string;
  secondaryText: string;
  border: string;
  cardBackground: string;
  cardHeaderBackground: string;
  inputBackground: string;
  inputBorder: string;
  userMessageBackground: string;
  userMessageText: string;
  assistantMessageBackground: string;
  assistantMessageText: string;
  eventBlockBackground: string;
  eventBlockText: string;
  emptyText: string;
};

interface ThemeContextValue {
  /** Whether dark mode is currently enabled */
  isDark: boolean;
  /** Toggle between light and dark modes */
  toggleTheme: () => void;
  /** The resolved palette of colors to use in the UI */
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  text: '#000000',
  secondaryText: '#555555',
  border: '#eeeeee',
  cardBackground: '#f0f0f0',
  cardHeaderBackground: '#f0f0f0',
  inputBackground: '#ffffff',
  inputBorder: '#dddddd',
  userMessageBackground: '#007AFF',
  userMessageText: '#ffffff',
  assistantMessageBackground: '#E5E5EA',
  assistantMessageText: '#000000',
  eventBlockBackground: '#e3f2fd',
  eventBlockText: '#000000',
  emptyText: '#888888',
};

const darkColors: ThemeColors = {
  background: '#121212',
  text: '#ffffff',
  secondaryText: '#bbbbbb',
  border: '#444444',
  cardBackground: '#1e1e1e',
  cardHeaderBackground: '#1e1e1e',
  inputBackground: '#1e1e1e',
  inputBorder: '#444444',
  userMessageBackground: '#0A84FF',
  userMessageText: '#ffffff',
  assistantMessageBackground: '#333333',
  assistantMessageText: '#ffffff',
  eventBlockBackground: '#253341',
  eventBlockText: '#ffffff',
  emptyText: '#aaaaaa',
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the current theme context. Components should use this
 * rather than reading from ThemeContext directly. When the theme is
 * toggled all subscribers re-render automatically.
 */
export function useTheme() {
  return useContext(ThemeContext);
}