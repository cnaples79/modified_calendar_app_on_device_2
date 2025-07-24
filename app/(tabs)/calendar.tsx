import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Button, ScrollView, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useRouter } from 'expo-router';
import CalendarGrid from '../../components/CalendarGrid';
import DailyTimeline from '../../components/DailyTimeline';
import calendarService from '../../services/CalendarService';
import { Event } from '../../types/Event';
import { DateData } from 'react-native-calendars';
import { MarkingProps } from 'react-native-calendars/src/calendar/day/marking';

const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<{ [key: string]: MarkingProps }>({});
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedDay, setSelectedDay] = useState<DateData | null>(null);
  const router = useRouter();

  // Retrieve the current colours from the theme context. These values
  // automatically update when the user toggles dark mode.
  const { colors } = useTheme();

  const fetchData = useCallback(() => {
    const events = calendarService.getAllEvents();
    setAllEvents(events);

    const newMarkedDates: { [key: string]: MarkingProps } = {};
    events.forEach((event: Event) => {
      const dateString = toLocalDateKey(event.startTime);
      newMarkedDates[dateString] = { marked: true, dotColor: 'blue' };
    });
    setMarkedDates(newMarkedDates);
  }, []);

  useEffect(() => {
    calendarService.subscribe(fetchData);
    // Initialise the calendar database and load persisted events.
    calendarService
      .init()
      .then(fetchData)
      .catch(err => console.error('Failed to initialise calendar service:', err));
    return () => {
      calendarService.unsubscribe(fetchData);
    };
  }, [fetchData]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    // Appending 'T00:00:00' ensures the date is parsed in the local timezone, not UTC
    return calendarService.getEventsForDate(new Date(`${selectedDay.dateString}T00:00:00`));
  }, [selectedDay, allEvents]);

  const onDayPress = (day: DateData) => {
    setSelectedDay(day);
  };

  const onEditEvent = (event: Event) => {
    router.push({ pathname: '/event-modal', params: { eventId: event.id } });
  };

  const onDeleteEvent = (event: Event) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => calendarService.deleteEvent(event.id),
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View
        style={[styles.headerContainer, { borderBottomColor: colors.border }]}
      >
        <Link href="/event-modal" asChild>
          <Button title="Add New Event" />
        </Link>
      </View>

      <CalendarGrid markedDates={markedDates} onDayPress={onDayPress} />
      
      {selectedDay && <DailyTimeline events={selectedDayEvents} />}

      {selectedDayEvents.length > 0 ? (
        <View style={styles.eventListContainer}>
          <Text style={[styles.listHeader, { backgroundColor: colors.cardHeaderBackground, color: colors.text }]}>Events for {selectedDay?.dateString}</Text>
          {selectedDayEvents.map(item => (
            <View key={item.id} style={[styles.eventItemContainer, { borderBottomColor: colors.border }]}> 
              <TouchableOpacity
                style={styles.eventTouchable}
                onPress={() => onEditEvent(item)}
              >
                <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                {item.description && (
                  <Text style={[styles.eventDescription, { color: colors.secondaryText }]}>{item.description}</Text>
                )}
              </TouchableOpacity>
              <Button title="Delete" color="red" onPress={() => onDeleteEvent(item)} />
            </View>
          ))}
        </View>
      ) : selectedDay && (
        <Text style={[styles.emptyText, { color: colors.emptyText }]}>No events for this day.</Text>
      )}

      {!selectedDay && (
        <Text style={[styles.emptyText, { color: colors.emptyText }]}>Select a day to see events.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventListContainer: {
    marginTop: 10,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  eventItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventTouchable: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    color: 'gray',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
});
