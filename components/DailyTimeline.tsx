import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Event } from '../types/Event';

interface DailyTimelineProps {
  events: Event[];
}

const DailyTimeline: React.FC<DailyTimelineProps> = ({ events }) => {
  const router = useRouter();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const { colors } = useTheme();

  const formatTime = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Daily Timeline</Text>
      <ScrollView style={styles.timelineContainer}>
        {hours.map(hour => {
          const hourEvents = events.filter(event => event.startTime.getHours() === hour);
          return (
            <View key={hour} style={styles.timeSlot}>
              <Text style={[styles.timeText, { color: colors.secondaryText }]}>{formatTime(hour)}</Text>
              <View style={[styles.eventsContainer, { borderLeftColor: colors.border }]}> 
                {hourEvents.length > 0 ? (
                  hourEvents.map(event => (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.eventBlock, { backgroundColor: colors.eventBlockBackground }]}
                      onPress={() =>
                        router.push({ pathname: '/modal/event-details', params: { eventId: event.id } })
                      }
                    >
                      <Text style={[styles.eventTitle, { color: colors.eventBlockText }]}>{event.title}</Text>
                      <Text style={[styles.eventTime, { color: colors.secondaryText }]}> 
                        {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noEventBlock} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timelineContainer: {},

  timeSlot: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timeText: {
    width: 80,
    color: '#888',
  },
  eventsContainer: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    paddingLeft: 10,
  },
  eventBlock: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  eventTitle: {
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 12,
    color: '#555',
  },
  noEventBlock: {
    height: 20, // Placeholder height for empty slots
  },
});

export default DailyTimeline;
