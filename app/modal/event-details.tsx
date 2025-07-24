import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CalendarService from '../../services/CalendarService';

export default function EventDetailsModal() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const event = eventId ? CalendarService.getEventById(eventId) : null;

  // Grab current theme colours
  const { colors } = useTheme();

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Text style={{ color: colors.text }}>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
      <Text style={[styles.time, { color: colors.secondaryText }]}>
        {event.startTime.toLocaleString()} - {event.endTime.toLocaleString()}
      </Text>
      {event.description && (
        <Text style={[styles.description, { color: colors.secondaryText }]}>{event.description}</Text>
      )}
      <Button
        title="Edit"
        onPress={() => router.push({ pathname: '/event-modal', params: { eventId: event.id } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  time: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
  },
});
