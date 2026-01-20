# Seeksy AI Navigation & Assistant System V1

## Overview

The Seeksy AI Navigation & Assistant System combines a powerful command palette with a comprehensive AI assistant panel, both integrated with the Global Persona Orchestrator for intelligent routing and context-aware assistance.

## Core Components

### 1. Command Palette (⌘K / Ctrl+K)

A global command palette for quick navigation and AI assistance across the entire platform.

**Features:**
- **Keyboard Shortcut**: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Fuzzy Search**: Find pages, modules, contacts, meetings, episodes, events, campaigns
- **Quick Actions**: Create meetings, events, episodes, campaigns without navigating
- **AI Persona Integration**: Direct access to specialized AI assistants
- **Keyboard Navigation**: Arrow keys + Enter for fast navigation
- **Categorized Results**: Navigation, Quick Actions, AI Assistants

**Location**: `src/components/command/CommandPalette.tsx`

**Usage Example:**
```tsx
import { useCommandPalette } from "@/hooks/useCommandPalette";

function MyComponent() {
  const { open, close, toggle } = useCommandPalette();
  
  return (
    <button onClick={open}>Open Command Palette</button>
  );
}
```

### 2. AI Assistant Panel

A floating, context-aware AI assistant panel that routes requests to specialized personas.

**Features:**
- **Context-Aware Routing**: Automatically detects current module and routes to appropriate persona
- **Threaded Chat**: Full conversation history with persona avatars
- **Persona Visibility**: See which specialized AI (Mia, Castor, Echo, etc.) is responding
- **Multi-Modal Actions**: Create meetings, episodes, campaigns, segments, etc.
- **Smart Context Detection**: Uses current route to provide relevant assistance

**Location**: `src/components/ai/AIAssistantPanel.tsx`

**Usage Example:**
```tsx
import { useAIAssistant } from "@/hooks/useAIAssistant";

function MyComponent() {
  const { open, setContext } = useAIAssistant();
  
  const askForHelp = () => {
    setContext("Need help with podcast episode");
    open();
  };
  
  return (
    <button onClick={askForHelp}>Ask AI for Help</button>
  );
}
```

## Persona Routing

The system automatically routes user requests to the appropriate AI persona based on:

1. **Current Route Context**:
   - `/meetings` → **Mia** (Meetings & Events Coordinator)
   - `/podcasts` → **Castor** (Podcast Production Manager)
   - `/studio` → **Echo** (Studio Director)
   - `/email` or `/campaigns` → **Scribe** (Email & Communication Intelligence)
   - `/contacts` or `/analytics` → **Atlas** (Data & Analytics Guide)
   - `/clips` or `/media` → **Reel** (Clips & Media Assistant)
   - `/identity` → **Lex** (Identity & Rights Advisor)

2. **Message Keywords**:
   - "meeting", "calendar", "schedule" → Mia
   - "podcast", "episode", "publish" → Castor
   - "studio", "recording", "guest" → Echo
   - "email", "campaign", "draft" → Scribe
   - "analytics", "data", "insights" → Atlas
   - "clip", "video", "social" → Reel
   - "identity", "rights", "certificate" → Lex

## Integration Points

### Global Providers

Both systems are integrated at the app level:

```tsx
// src/App.tsx
<CommandPaletteProvider>
  <AIAssistantProvider>
    <AppContent />
    <CommandPalette />
    <AIAssistantPanel />
  </AIAssistantProvider>
</CommandPaletteProvider>
```

### Navigation Shortcuts Component

For easy integration in headers or toolbars:

```tsx
import { NavigationShortcuts } from "@/components/ui/NavigationShortcuts";

function Header() {
  return (
    <header>
      <NavigationShortcuts />
    </header>
  );
}
```

## Backend Integration

Both systems communicate with the `global-agent` edge function:

**Endpoint**: `supabase.functions.invoke("global-agent")`

**Request Payload**:
```json
{
  "message": "User's message or query",
  "context": {
    "route": "/current/path",
    "module": "podcasts",
    "additionalContext": "Any extra context"
  }
}
```

**Response**:
```json
{
  "success": true,
  "persona": "castor",
  "response": "AI-generated response text"
}
```

## Keyboard Shortcuts

- **⌘K / Ctrl+K**: Open Command Palette
- **ESC**: Close Command Palette or AI Assistant
- **↑ / ↓**: Navigate command palette results
- **Enter**: Execute selected command
- **Cmd+Shift+S**: Open AI chat widget (SeeksyAIChatWidget)

## Specialized Personas

### Mia - Meetings & Events Coordinator
- Meeting scheduling
- Event creation
- Follow-up email drafts (via Scribe)
- Guest invitations
- Calendar automation

### Castor - Podcast Production Manager
- Podcast publishing
- Episode notes
- Social post drafts
- Clip suggestions

### Echo - Studio Director
- Recording guidance
- Guest coordination
- Pre/post-production prompts
- Episode notification drafts

### Scribe - Email & Communication Intelligence
- Drafts emails
- Improves text
- Generates subject lines/preheaders
- Personalizes based on contact data
- Writes campaigns, follow-ups, announcements

### Atlas - Data & Analytics Guide
- Engagement summaries
- Email performance analysis
- Smart send time computation
- Segment insights

### Reel - Clips & Media Assistant
- Clip naming
- Clip descriptions
- Social scriptwriting

### Lex - Identity & Rights Advisor
- Face/voice verification assistance
- Rights management
- Certificate interpretation
- Licensing compliance

## Future Enhancements

- **Voice Commands**: Trigger command palette and AI assistant with voice
- **Recent Items**: Show recently accessed pages and entities
- **Smart Suggestions**: AI-powered action suggestions based on user behavior
- **Cross-Module Actions**: Execute complex workflows across multiple modules
- **Memory System**: Persistent conversation context per user
- **Quick Capture**: Save ideas, notes, tasks directly from command palette
- **Search Expansion**: Include contacts, events, episodes in search results

## Best Practices

1. **Use Command Palette for Navigation**: Faster than clicking through menus
2. **Use AI Assistant for Complex Tasks**: Better than navigating forms manually
3. **Provide Context**: The more context you give, the better the AI response
4. **Use Keyboard Shortcuts**: Improves speed and efficiency
5. **Check Persona**: Make sure the right specialized AI is handling your request

## Technical Architecture

```
User Input
    ↓
Command Palette OR AI Assistant Panel
    ↓
Global Agent Edge Function
    ↓
Persona Detection (route + keywords)
    ↓
Specialized Persona Handler (Mia, Castor, Echo, etc.)
    ↓
AI Response (via Lovable AI Gateway)
    ↓
Display to User (with persona avatar/name)
```

## Files Reference

### Core Components
- `src/components/command/CommandPalette.tsx` - Main command palette UI
- `src/components/command/CommandPaletteProvider.tsx` - State management + keyboard shortcuts
- `src/components/ai/AIAssistantPanel.tsx` - AI assistant panel UI
- `src/components/ai/AIAssistantProvider.tsx` - AI panel state management
- `src/components/ui/NavigationShortcuts.tsx` - Quick access buttons

### Hooks
- `src/hooks/useCommandPalette.ts` - Command palette hook
- `src/hooks/useAIAssistant.ts` - AI assistant hook

### Backend
- `supabase/functions/global-agent/index.ts` - Persona routing orchestrator
- `supabase/functions/scribe-agent/index.ts` - Email/communication persona

### Configuration
- `src/lib/email-personas.ts` - Persona definitions and metadata
- `supabase/config.toml` - Edge function configuration

## Support

For issues or questions about the AI Navigation & Assistant System, contact the Seeksy development team or refer to the main project documentation.
