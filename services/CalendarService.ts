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
  private db!: SQLite.SQLiteDatabase;
  private events: Event[] = [];
  private subscribers: Subscriber[] = [];

  constructor() {
    // The database is opened asynchronously in the init() method.
    // This constructor is intentionally left empty.
  }

  /**
   * Initialises the events table if it does not exist and loads any
   * existing events into memory. Returns a promise that resolves once
   * the events have been loaded.
   */
  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('calendar.db');
    await this.db.execAsync(
      'CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, startTime INTEGER NOT NULL, endTime INTEGER NOT NULL, description TEXT)'
    );
    await this.loadEvents();
  }

  /**
   * Reads all events from the database into the in-memory array. Should
   * be called during initialisation. Also notifies subscribers that
   * data has been loaded.
   */
  private async loadEvents(): Promise<void> {
    const result = await this.db.getAllAsync<any>('SELECT * FROM events');
    const loaded: Event[] = result.map(row => ({
      id: row.id,
      title: row.title,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
      description: row.description ?? undefined,
    }));
    this.events = loaded;
    this.notify();
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
    this.db.runAsync(
      'INSERT INTO events (id, title, startTime, endTime, description) VALUES (?, ?, ?, ?, ?)',
      [id, title, startMillis, endMillis, description ?? null]
    );
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
      this.db.runAsync(
        'UPDATE events SET title = ?, startTime = ?, endTime = ?, description = ? WHERE id = ?',
        [title, startMillis, endMillis, description ?? null, id]
      );
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
      this.db.runAsync('DELETE FROM events WHERE id = ?', [eventToDelete.id]);
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
  async updateEvent(id: string, title: string, description?: string): Promise<Event | undefined> {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex > -1) {
      const existing = this.events[eventIndex];
      const updatedEvent: Event = { ...existing, title, description };
      this.events[eventIndex] = updatedEvent;
      this.notify();
      // Persist asynchronously
      await this.db.runAsync(
        'UPDATE events SET title = ?, description = ? WHERE id = ?',
        [title, description ?? null, id]
      );
      return updatedEvent;
    }
    return undefined;
  }

  /**
   * Deletes the event with the given ID. Returns true if successful.
   */
  async deleteEvent(id: string): Promise<boolean> {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex > -1) {
      this.events.splice(eventIndex, 1);
      this.notify();
      // Persist asynchronously
      await this.db.runAsync('DELETE FROM events WHERE id = ?', [id]);
      return true;
    }
    return false;
  }
}

const calendarService = new CalendarService();
export default calendarService;
