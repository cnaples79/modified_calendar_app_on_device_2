import * as SQLite from 'expo-sqlite';
import { Event } from '../types/Event';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string | Event[];
};

/**
 * ChatStorageService persists chat messages to the same SQLite database
 * used for event storage. Messages are stored as JSON strings along
 * with their role and a timestamp. On retrieval the JSON is parsed
 * back into either a string or an array of events with Date objects
 * restored for event times.
 */
class ChatStorageService {
  private db!: SQLite.SQLiteDatabase;

  constructor() {
    // Database is opened asynchronously in init()
  }

  /**
   * Ensures the messages table exists. Should be called before any
   * other operations.
   */
  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('calendar.db');
    await this.db.execAsync(
      'CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, content TEXT NOT NULL, timestamp INTEGER NOT NULL)'
    );
  }

  /**
   * Saves a message to the database. The content can be a string or an
   * array of events; it will be serialised to JSON. The timestamp
   * defaults to the current time.
   */
  async saveMessage(role: 'user' | 'assistant', content: string | Event[]): Promise<void> {
    const json = typeof content === 'string' ? JSON.stringify({ text: content }) : JSON.stringify(content);
    const ts = Date.now();
    await this.db.runAsync(
      'INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)',
      [role, json, ts]
    );
  }

  /**
   * Retrieves all messages from the database sorted by timestamp in
   * ascending order. Each message's content is parsed back into its
   * original shape.
   */
  async getAllMessages(): Promise<ChatMessage[]> {
    const result = await this.db.getAllAsync<any>('SELECT role, content FROM messages ORDER BY timestamp ASC');
    return result.map(row => {
      let parsed: any;
      try {
        parsed = JSON.parse(row.content);
      } catch (e) {
        parsed = row.content;
      }
      // If the parsed result has a `text` property treat it as a plain string
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'text' in parsed) {
        parsed = parsed.text;
      }
      // If it's an array assume it's events and convert times back to Date objects
      if (Array.isArray(parsed)) {
        parsed = parsed.map((ev: any) => ({
          ...ev,
          startTime: ev.startTime ? new Date(ev.startTime) : undefined,
          endTime: ev.endTime ? new Date(ev.endTime) : undefined,
        })) as Event[];
      }
      return { role: row.role as 'user' | 'assistant', content: parsed };
    });
  }

  /**
   * Removes all chat messages from the database. Useful for debugging or
   * resetting state.
   */
  async clearAll(): Promise<void> {
    await this.db.execAsync('DELETE FROM messages');
  }
}

const chatStorageService = new ChatStorageService();
export default chatStorageService;