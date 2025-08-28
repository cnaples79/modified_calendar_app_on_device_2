# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Start development server**: `npx expo start`
- **Run on Android**: `npm run android` or `expo run:android`
- **Run on iOS**: `npm run ios` or `expo run:ios`
- **Run on Web**: `npm run web`
- **Lint code**: `npm run lint`

### Project Reset
- **Reset project**: `npm run reset-project` (runs custom script to reset project state)

## Architecture Overview

This is a React Native mobile calendar application built with Expo that combines traditional calendar functionality with AI-powered natural language event management.

### Key Technologies
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript with strict mode
- **Navigation**: Expo Router with file-based routing
- **Database**: SQLite via expo-sqlite for local event persistence
- **AI**: On-device language model using llama.rn with SmolLM2-135M-Instruct model
- **UI Components**: react-native-calendars for calendar grid

### Core Architecture

The app uses a service-based architecture with clear separation between UI, business logic, and data persistence:

**Services Layer** (`/services/`):
- `CalendarService.ts`: Singleton service managing event CRUD operations with SQLite persistence and observer pattern for UI updates
- `AIService.ts`: On-device AI service using llama.rn, initializes SmolLM2 model from bundled GGUF file
- `ActionParser.ts`: Parses AI responses into structured commands and executes them via CalendarService

**UI Architecture**:
- Tab-based navigation with calendar and chat screens
- Modal-based event creation/editing
- Observer pattern connects services to UI components for real-time updates

### Critical Implementation Details

**Database Schema**:
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL, 
  title TEXT NOT NULL, 
  startTime INTEGER NOT NULL, 
  endTime INTEGER NOT NULL, 
  description TEXT
)
```

**AI Command Format**:
The AI uses structured commands that ActionParser processes:
- `ACTION:CREATE_EVENT(title="...", startTime="YYYY-MM-DDTHH:mm:ss", endTime="YYYY-MM-DDTHH:mm:ss", description="...")`
- `ACTION:READ_EVENTS(title="...")`
- `ACTION:UPDATE_EVENT(title="...", updates="{\"key\":\"value\"}")`
- `ACTION:DELETE_EVENT(title="...")`

**On-Device AI Setup**:
- Model: SmolLM2-135M-Instruct-Q4_K_M.gguf (bundled in assets/models/)
- Runtime: Model copied to document directory on first use
- Context window: 2048 tokens to balance performance and memory usage

### File Structure
- `app/`: Expo Router screens and layouts
  - `(tabs)/`: Tab navigator screens (calendar, chat, settings)
  - `modal/`: Modal screens for event details
- `services/`: Business logic and data management
- `components/`: Reusable UI components (CalendarGrid, DailyTimeline, EventForm)
- `types/`: TypeScript type definitions
- `contexts/`: React contexts (ThemeContext)

### Development Notes

**Metro Configuration**: 
- Custom asset extension for `.gguf` files to bundle AI model

**Environment Variables**:
- No external API keys required - uses on-device AI model
- Previous OpenRouter integration has been replaced with local model

**Platform Support**:
- iOS and Android native apps via Expo
- Web support available but AI functionality may be limited
- New Architecture enabled in app.json

**Model Initialization**:
- AI model initialization is asynchronous and happens on first chat interaction
- Model asset is automatically copied to writable directory on first use
- Subsequent app launches reuse existing model file