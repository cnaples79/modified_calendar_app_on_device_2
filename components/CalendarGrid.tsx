import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { MarkingProps } from 'react-native-calendars/src/calendar/day/marking';
import { useTheme } from '../contexts/ThemeContext';

interface CalendarGridProps {
  markedDates: { [key: string]: MarkingProps };
  onDayPress: (day: DateData) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ markedDates, onDayPress }) => {
  // Pull theme colours to customise the calendar appearance. Without
  // specifying a theme the calendar always renders with a light
  // background which looks out of place when dark mode is enabled.
  const { colors } = useTheme();

  const calendarTheme = {
    calendarBackground: colors.background,
    textSectionTitleColor: colors.text,
    monthTextColor: colors.text,
    dayTextColor: colors.text,
    todayTextColor: colors.userMessageBackground,
    selectedDayBackgroundColor: colors.userMessageBackground,
    selectedDayTextColor: colors.userMessageText,
    arrowColor: colors.text,
    dotColor: colors.userMessageBackground,
    selectedDotColor: colors.userMessageText,
  };
  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        monthFormat={'MMMM yyyy'}
        hideExtraDays={true}
        firstDay={1} // Monday
        markedDates={markedDates}
        theme={calendarTheme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
  },
});

export default CalendarGrid;
