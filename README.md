# AI Calendar - React Native

A mobile calendar application built with React Native and Expo that allows users to manage events through both a rich graphical interface and natural language AI commands. This project is a mobile-first implementation inspired by a desktop version originally built with Groovy and JavaFX.

## Features

### Core Calendar Functionality
- **Interactive Monthly Grid**: A full-featured monthly calendar to view your schedule at a glance.
- **Daily Timeline View**: Select any day to see a detailed, scrollable hourly timeline of your events.
- **Event Markers**: Days with events are clearly marked with dots on the monthly grid.

### AI-Powered Management
- **Conversational Chat Interface**: Manage your calendar by simply talking to the AI.
- **Full CRUD via AI**: Create, read, update, and delete events using natural language commands (e.g., "Schedule a meeting tomorrow at 2 PM," "Change the meeting to 3 PM," "Delete my 10am appointment").
- **Reliable Action Parsing**: The AI returns structured commands that the app parses and executes, ensuring your requests are handled accurately.

### Manual Event Management
- **Create & Edit Events**: A user-friendly modal form allows for manual creation and editing of events.
- **View & Delete Events**: Tap events in the timeline to view details or delete them with a confirmation step.
- **Real-time UI Updates**: The calendar and event lists refresh instantly after any changes are made, whether manually or through AI.

## Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **UI Components**: `react-native-calendars`
- **State Management**: React Hooks (`useState`, `useCallback`, `useContext`) and an Observer pattern for service updates.

## Project Structure

```
AI_Calendar/
├── app/
│   ├── (tabs)/           # Main screens for the tab navigator
│   │   ├── _layout.tsx   # Tab layout configuration
│   │   ├── calendar.tsx  # Main calendar screen
│   │   └── chat.tsx      # AI chat interface
│   ├── _layout.tsx       # Root layout for the app
│   └── event-modal.tsx   # Modal for creating/editing events
├── assets/                 # Static assets (icons, fonts, etc.)
└── services/               # Core application logic
    ├── AIService.ts        # Handles communication with the AI model
    ├── ActionParser.ts     # Parses and executes commands from the AI
    └── CalendarService.ts  # Manages all event data (CRUD operations)
```

## Configuration

For AI functionality, create a `.env` file in the root of the project and add your OpenRouter API key:

```
EXPO_PUBLIC_OPENROUTER_API_KEY="your_api_key_here"
```

## AI Command Format

The AI uses a specific format that the `ActionParser` service processes:

- **Create**: `ACTION:CREATE_EVENT(title="...", startTime="...", endTime="...")`
- **Read**: `ACTION:READ_EVENTS(title="...")`
- **Update**: `ACTION:UPDATE_EVENT(title="...", updates="{...}")`
- **Delete**: `ACTION:DELETE_EVENT(title="...")`

## How to Run

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npx expo start
    ```
4.  Scan the QR code with the Expo Go app on your iOS or Android device to run it on your phone, or press `w` to open it in a web browser.


Made with ❤️ from Charlotte.

