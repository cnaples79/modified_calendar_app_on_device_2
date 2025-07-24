import { Event } from '../types/Event';
import calendarService from './CalendarService';

// Defines the structure of a parsed AI command
interface Action {
  command: 'CREATE_EVENT' | 'READ_EVENTS' | 'UPDATE_EVENT' | 'DELETE_EVENT';
  params: { [key: string]: any };
}

class ActionParser {
  // Tries to parse a raw text response from the AI into a structured Action
  static parse(text: string): Action | null {
    const match = text.match(/ACTION:(\w+)\((.*)\)/s); // Use 's' flag for dotall
    if (!match) {
      return null;
    }

    const [, command, paramsStr] = match;
    const params: { [key: string]: any } = {};

    try {
      if (paramsStr) {
        // This regex handles key="value" pairs, including escaped quotes within the value.
        const paramRegex = /(\w+)="((?:\\"|[^"])*)"/g;
        let paramMatch;
        while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
          // The value is the second capture group, unescape quotes
          params[paramMatch[1]] = paramMatch[2].replace(/\\"/g, '"');
        }
      }
    } catch (e) {
      console.error('Failed to parse action parameters:', e);
      return null; // Don't proceed if params are malformed
    }

    return {
      command: command as Action['command'],
      params,
    };
  }

  // Executes the parsed action by calling the appropriate service
  static async execute(action: Action): Promise<string | Event[]> {
    switch (action.command) {
      case 'CREATE_EVENT': {
        const { title, startTime, endTime, description } = action.params;
        if (title && startTime && endTime) {
          calendarService.createEvent(title, startTime, endTime, description || '');
          return 'Event created successfully.';
        } else {
          return 'Create event failed: Missing required parameters.';
        }
      }

      case 'READ_EVENTS': {
        const { title } = action.params;
        // If title is an empty string or undefined, find all events.
        const events = (title && title.length > 0) ? calendarService.findEventsByTitle(title) : calendarService.getAllEvents();
        return events;
      }

      case 'UPDATE_EVENT': {
        const { title, updates } = action.params;
        if (!title || !updates) {
          return 'Update failed: Missing title or update information.';
        }
        try {
          const parsedUpdates = JSON.parse(updates);
          
          if (parsedUpdates.startTime) {
            parsedUpdates.startTime = new Date(parsedUpdates.startTime);
          }
          if (parsedUpdates.endTime) {
            parsedUpdates.endTime = new Date(parsedUpdates.endTime);
          }

          const success = calendarService.updateEventByTitle(title, parsedUpdates);
          return success ? `Event '${title}' updated successfully.` : `Could not find an event with the title '${title}'.`;
        } catch (e) {
          console.error('Failed to parse updates for UPDATE_EVENT:', e);
          return 'There was an error updating the event. The update details were not formatted correctly.';
        }
      }

      case 'DELETE_EVENT': {
        const { title } = action.params;
        if (!title) {
            return 'Delete failed: Missing title information.';
        }
        const success = calendarService.deleteEventByTitle(title);
        return success ? `Event '${title}' deleted successfully.` : `Could not find an event with the title '${title}'.`;
      }

      default:
        return `Unknown command: ${action.command}`;
    }
  }
}

export default ActionParser;
