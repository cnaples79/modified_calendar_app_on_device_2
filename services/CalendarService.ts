import { Event } from '../types/Event';
import * as SQLite from 'expo-sqlite';

/**
 * Subscriber type for clients interested in changes to the events list.
 */
type Subscriber = () => void;

/**
 * CalendarService persists events to a SQLite database so that they
 * survive app restarts. It maintains an in-memory cache of events for
 * fast access and notifies subscribers whenever the events list
 * changes. Most operations synchronously update the cache and
 * asynchronously write to the database.
 */
class CalendarService {
  private db: SQLite.SQLiteDatabase;
  private events: Event[] = [];
  private subscribers: Subscriber[] = [];

  constructor() {
    // Open (or create) a single database. Using the same file as the chat
    // store allows both tables to live together.
    this.db = SQLite.openDatabase('calendar.db');
  }

  /**
   * Initialises the events table if it does not exist and loads any
   * existing events into memory. Returns a promise that resolves once
   * the events have been loaded.
   */
  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, startTime INTEGER NOT NULL, endTime INTEGER NOT NULL, description TEXT)'
        );
      }, err => reject(err), () => {
        // After ensuring the table exists, load any persisted events
        this.loadEvents().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Reads all events from the database into the in-memory array. Should
   * be called during initialisation. Also notifies subscribers that
   * data has been loaded.
   */
  private loadEvents(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM events',
          [],
          (_, result) => {
            const rows = result.rows;
            const loaded: Event[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              loaded.push({
                id: row.id,
                title: row.title,
                startTime: new Date(row.startTime),
                endTime: new Date(row.endTime),
                description: row.description ?? undefined,
              });
            }
            this.events = loaded;
            this.notify();
            resolve();
          }
        );
      }, err => reject(err));
    });
  }

  subscribe(callback: Subscriber) {
    this.subscribers.push(callback);
  }

  unsubscribe(callback: Subscriber) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  /** Returns a snapshot of all events currently in memory. */
  getAllEvents(): Event[] {
    return this.events;
  }

  /**
   * Returns all events that occur on the given date. The provided
   * parameter can be any Date; the time part is ignored.
   */
  getEventsForDate(date: Date): Event[] {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    return this.events.filter(event => {
      const eventDate = new Date(event.startTime);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === selectedDate.getTime();
    });
  }

  /**
   * Creates a new event both in-memory and in the database. Returns the
   * newly created event. The identifier is generated from the current
   * timestamp to ensure uniqueness across sessions.
   */
  createEvent(title: string, startTime: string, endTime: string, description?: string): Event {
    const id = Date.now().toString();
    const newEvent: Event = {
      id,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };
    // Update the in-memory cache first so that UI updates immediately
    this.events.push(newEvent);
    this.notify();
    // Persist asynchronously
    const startMillis = new Date(startTime).getTime();
    const endMillis = new Date(endTime).getTime();
    this.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO events (id, title, startTime, endTime, description) VALUES (?, ?, ?, ?, ?)',
        [id, title, startMillis, endMillis, description ?? null]
      );
    });
    return newEvent;
  }

  /** Returns events whose titles include the provided query. */
  findEventsByTitle(titleQuery: string): Event[] {
    const lowercasedQuery = titleQuery.toLowerCase();
    return this.events.filter(event => event.title.toLowerCase().includes(lowercasedQuery));
  }

  /**
   * Updates the first event matching the provided title (case-insensitive).
   * Applies any updates to the in-memory cache and then writes the
   * changes to the database. Returns the updated event, if any.
   */
  updateEventByTitle(titleQuery: string, updates: Partial<Event>): Event | undefined {
    const eventToUpdate = this.events.find(event => event.title.toLowerCase().includes(titleQuery.toLowerCase()));
    if (eventToUpdate) {
      Object.assign(eventToUpdate, updates);
      this.notify();
      // Persist asynchronously
      const { id } = eventToUpdate;
      const { title, startTime, endTime, description } = eventToUpdate;
      const startMillis = startTime instanceof Date ? startTime.getTime() : new Date(startTime!).getTime();
      const endMillis = endTime instanceof Date ? endTime.getTime() : new Date(endTime!).getTime();
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE events SET title = ?, startTime = ?, endTime = ?, description = ? WHERE id = ?',
          [title, startMillis, endMillis, description ?? null, id]
        );
      });
      return eventToUpdate;
    }
    return undefined;
  }

  /**
   * Deletes the first event whose title matches the query.
   */
  deleteEventByTitle(titleQuery: string): boolean {
    const eventToDelete = this.findEventsByTitle(titleQuery)[0];
    if (eventToDelete) {
      this.events = this.events.filter(event => event.id !== eventToDelete.id);
      this.notify();
      // Persist asynchronously
      this.db.transaction(tx => {
        tx.executeSql('DELETE FROM events WHERE id = ?', [eventToDelete.id]);
      });
      return true;
    }
    return false;
  }

  /** Finds an event by its ID. */
  getEventById(id: string): Event | undefined {
    return this.events.find(event => event.id === id);
  }

  /**
   * Updates the event with the given ID. Returns the updated event if
   * successful.
   */
  updateEvent(id: string, title: string, description?: string): Event | undefined {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex > -1) {
      const existing = this.events[eventIndex];
      const updatedEvent: Event = { ...existing, title, description };
      this.events[eventIndex] = updatedEvent;
      this.notify();
      // Persist asynchronously
      const startMillis = existing.startTime.getTime();
      const endMillis = existing.endTime.getTime();
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE events SET title = ?, description = ?, startTime = ?, endTime = ? WHERE id = ?',
          [title, description ?? null, startMillis, endMillis, id]
        );
      });
      return updatedEvent;
    }
    return undefined;
  }

  /**
   * Deletes the event with the given ID. Returns true if an event was
   * removed.
   */
  deleteEvent(id: string): boolean {
    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.id !== id);
    this.notify();
    // Persist asynchronously
    this.db.transaction(tx => {
      tx.executeSql('DELETE FROM events WHERE id = ?', [id]);
    });
    return this.events.length < initialLength;
  }
}

const calendarService = new CalendarService();
export default calendarService;
