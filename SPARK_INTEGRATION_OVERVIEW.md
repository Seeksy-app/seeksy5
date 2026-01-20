# Seeksy Spark Integration Overview

## Overview

Seeksy Spark is the official AI assistant mascot integrated throughout the Seeksy platform. This document outlines the complete integration architecture, components, and usage guidelines.

---

## Core Components

### 1. Asset Management (`src/lib/spark/sparkAssets.ts`)

**Purpose**: Dynamic asset selection based on theme and season

**Key Functions**:
- `isHolidaySeason()` - Detects December 1-31 holiday mode
- `getCurrentTheme()` - Detects light/dark theme from DOM
- `getSparkAsset(pose, size, theme, holiday)` - Returns appropriate asset path
- `preloadSparkAssets()` - Preloads critical assets for smooth UX

**Asset Structure**:
```
public/spark/
├── base/           # Light mode assets
│   ├── spark-idle.png
│   ├── spark-happy.png
│   ├── spark-thinking.png
│   ├── spark-waving.png
│   ├── spark-idea.png
│   └── spark-typing.png
├── dark/           # Dark mode variants
│   ├── spark-idle-dark.png
│   ├── spark-happy-dark.png
│   ├── spark-thinking-dark.png
│   ├── spark-waving-dark.png
│   ├── spark-idea-dark.png
│   └── spark-typing-dark.png
├── holiday/        # Santa mode (Dec 1-31)
│   ├── spark-santa-idle.png
│   ├── spark-santa-waving.png
│   ├── spark-santa-idle-dark.png
│   └── spark-santa-waving-dark.png
└── icons/          # Sidebar & UI icons
    ├── spark-icon-32.png
    ├── spark-icon-20.png
    ├── spark-icon-16.png
    └── spark-santa-icon.png
```

---

### 2. Personality System (`src/lib/spark/sparkPersonality.ts`)

**Purpose**: Context-aware messaging and role-specific tone

**User Roles**:
- `creator` - Focus on content creation, growth, podcasting
- `advertiser` - Campaign clarity, ROI insights, conversions
- `admin` - Data-driven, financial, analytics-focused
- `guest` - General welcome messages

**Key Functions**:
- `getSparkGreeting(role)` - Role-specific welcome message
- `getSparkContextHint(context, role)` - Page-aware helpful hints
- `getSparkEmptyStateMessage(entityType, role)` - Empty state encouragement
- `getSparkOnboardingMessage(role)` - First-time user onboarding

**Context-Aware Hints** (Examples):
- **Podcast Studio**: "Try marking ad-break markers — Spark can auto-detect good clip moments! 🎙️✨"
- **Advertiser Campaign**: "Your CPM looks strong — Spark can model impressions based on your budget."
- **Admin Rate Desk**: "Spark analyzed current CPMs — some inventory might be underpriced."

---

### 3. React Components

#### `SparkAvatar` (`src/components/spark/SparkAvatar.tsx`)
Displays Spark character with automatic theme/season detection.

**Props**:
```tsx
interface SparkAvatarProps {
  pose?: "idle" | "happy" | "thinking" | "waving" | "idea" | "typing";
  size?: "full" | "icon-32" | "icon-20" | "icon-16" | number;
  className?: string;
  animated?: boolean; // Hover scale effect
  onClick?: () => void;
  alt?: string;
}
```

**Usage**:
```tsx
<SparkAvatar pose="waving" size={48} animated />
```

---

#### `SparkWelcomeModal` (`src/components/spark/SparkWelcomeModal.tsx`)
First-time user onboarding modal.

**Props**:
```tsx
interface SparkWelcomeModalProps {
  role: UserRole;
  onComplete: () => void;
}
```

**Behavior**:
- Displays once per user (tracked in localStorage: `spark_welcome_seen`)
- Shows role-specific onboarding message
- Animated waving Spark avatar

---

#### `SparkEmptyState` (`src/components/spark/SparkEmptyState.tsx`)
Empty state component with Spark encouragement.

**Props**:
```tsx
interface SparkEmptyStateProps {
  entityType: "episodes" | "campaigns" | "events" | "meetings" | "posts" | "contacts";
  role?: UserRole;
  onActionClick?: () => void;
  actionLabel?: string;
}
```

**Usage**:
```tsx
<SparkEmptyState
  entityType="episodes"
  role="creator"
  onActionClick={() => navigate("/podcast/create")}
  actionLabel="Create First Episode"
/>
```

---

#### `SparkSnowfall` (`src/components/spark/SparkSnowfall.tsx`)
Optional holiday snowfall effect.

**Behavior**:
- Auto-enabled during December unless disabled by user
- CSS-only animations (no performance impact)
- Respects `prefers-reduced-motion`
- Can be disabled via localStorage: `spark_snowfall_enabled=false`

---

### 4. React Hooks

#### `useSparkContextHints` (`src/hooks/useSparkContextHints.tsx`)
Provides context-aware hints based on current route.

**Returns**:
```tsx
{
  context: PageContext;  // Current page context
  role: UserRole;        // User's role
  hint: SparkMessage | null;  // Context hint (if any)
  hasHint: boolean;      // Whether a hint exists
}
```

**Usage**:
```tsx
const { hint, hasHint } = useSparkContextHints();

{hasHint && hint && (
  <div className="spark-hint">
    {hint.emoji} {hint.text}
  </div>
)}
```

---

## Integration Points

### 1. AI Chat Widget (`SeeksyAIChatWidget`)
- **Replaced**: Old AI icon with Spark avatar
- **Features**:
  - Dynamic Spark avatar in chat header
  - Typing indicator uses `spark-typing.png`
  - Floating button shows idle Spark
  - Holiday mode activates Santa variant automatically (Dec 1-31)
  - Sidebar "Ask Spark" button triggers chat
  - Keyboard shortcut: Cmd/Ctrl+Shift+S

**Updates Made**:
- Header displays "Seeksy Spark — Your AI Guide ✨"
- Avatar changes based on message state (idle/typing)
- Floating button uses Spark instead of generic icon
- Seasonal gradient (yellow/amber regular, red/green holiday)

---

### 2. Sidebar Integration (`AppSidebar`)
- **Location**: `SidebarFooter`
- **Button**: "Ask Spark" with 32px icon and tagline
- **Behavior**: Opens SeeksyAIChatWidget via custom event
- **Icon**: Uses `spark-icon-32.png`

---

### 3. Dashboard Welcome Modal
- **Component**: `SparkWelcomeModal`
- **Trigger**: First-time dashboard visit (tracked via localStorage: `spark_welcome_seen`)
- **Behavior**: 
  - Displays role-specific onboarding message
  - Animated waving Spark avatar
  - "Let's Begin" button completes onboarding
  - Shows for creator and advertiser roles only

---

### 4. CFO AI Assistant
- **Component**: `CFOAIChat`
- **Integration**: Replaced Sparkles icon with Spark thinking pose
- **Display**: "Ask Seeksy Spark" header with 20px Spark avatar
- **Behavior**: Dynamic Spark avatar provides visual AI assistant branding

---

### 5. Holiday Mode (Automatic)
- **Component**: `SparkSnowfall`
- **Trigger**: Auto-activates December 1-31
- **Features**:
  - CSS-only lightweight snowfall particles
  - Respects `prefers-reduced-motion`
  - Can be disabled via localStorage: `spark_snowfall_enabled=false`
  - Integrated at App.tsx root level

---

### 6. Empty States (Planned)
Replace all empty states across:
- **Podcast Episodes** (`/podcasts/:id`)
- **Advertiser Campaigns** (`/advertiser/campaigns`)
- **Events** (`/events`)
- **Meetings** (`/meetings`)
- **Blog Posts** (`/my-blog`)
- **Contacts** (`/crm`)

**Implementation**:
```tsx
import { SparkEmptyState } from "@/components/spark/SparkEmptyState";

{episodes.length === 0 && (
  <SparkEmptyState
    entityType="episodes"
    onActionClick={() => navigate("/podcast/create")}
    actionLabel="Create Your First Episode"
  />
)}
```

---

## Holiday Mode (December 1-31)

### Automatic Activation
- **Detection**: `isHolidaySeason()` checks if current month is December
- **Assets**: Automatically switches to Santa hat variants
- **Snowfall**: Optional CSS-only snowflakes

### Manual Control
Users can control holiday mode via localStorage:
```javascript
// Disable holiday mode
localStorage.setItem("spark_holiday_mode", "disabled");

// Disable snowfall
localStorage.setItem("spark_snowfall_enabled", "false");
```

---

## Theme Detection

Spark automatically detects theme changes:

1. **DOM Attribute**: `data-theme="dark"` on `<html>`
2. **CSS Class**: `.dark` class on `<html>` (Tailwind)
3. **System Preference**: `prefers-color-scheme: dark`

**Automatic Updates**: `SparkAvatar` uses MutationObserver to re-render on theme changes.

---

## Performance Optimization

### Asset Preloading
Critical assets are preloaded on app load:
```tsx
useEffect(() => {
  preloadSparkAssets();
}, []);
```

### CSS-Only Animations
- Snowfall uses pure CSS (no JS animation loops)
- Respects `prefers-reduced-motion`
- No impact on app performance

---

## Personality Guidelines

### Tone
- **Friendly & Approachable**: Short, energetic phrases
- **Encouraging**: Positive reinforcement
- **Context-Aware**: Relevant to user's current task
- **Emoji Use**: Light, tasteful (✨ 🎙️ 📈 🌟 💡)

### Voice Examples

**Creator Mode**:
> "Your dashboard is looking good! Want to explore My Page or start a podcast? 🚀"

**Advertiser Mode**:
> "Your CPM looks strong — Spark can model impressions based on your budget. 📊"

**Admin Mode**:
> "Financial data looks solid! Want me to generate a custom scenario? 📈"

---

## Future Expansions

### Planned Features
1. **AI Tool Tips**: Spark appears as tooltip assistant on hover
2. **Guided Tours**: Spark-led onboarding tours
3. **Voice Mode**: Text-to-speech Spark responses
4. **Animated Transitions**: Micro-animations between poses
5. **Customization**: User-selectable Spark variants

### Additional Integration Points
- **CFO Dashboard** - Financial insights with Spark
- **Voice Certification** - Spark guides voice recording
- **Podcast Studio** - Real-time Spark suggestions
- **Rate Desk** - Spark CPM recommendations

---

## Troubleshooting

### Spark Not Showing Correct Theme
**Fix**: Ensure `data-theme` or `.dark` class is set on `<html>` element.

### Holiday Mode Not Activating
**Check**:
1. Current date is December 1-31
2. `localStorage.getItem("spark_holiday_mode")` is not `"disabled"`

### Snowfall Performance Issues
**Disable**: 
```javascript
localStorage.setItem("spark_snowfall_enabled", "false");
```

### Assets Not Loading
**Verify**:
1. Assets exist in `public/spark/` directory
2. Path matches `getSparkAsset()` output
3. Check browser console for 404 errors

---

## Technical Notes

- **No External Dependencies**: Pure TypeScript/React
- **Lightweight**: Asset files are optimized PNGs (~50-150KB each)
- **Accessible**: All images have proper `alt` text
- **Responsive**: Works on mobile, tablet, desktop

---

## Maintenance

### Adding New Poses
1. Generate new asset images (light, dark, holiday variants)
2. Add to `public/spark/` in appropriate folders
3. Update `SparkPose` type in `sparkAssets.ts`

### Adding New Context Hints
Update `sparkPersonality.ts`:
```tsx
const hints: Record<PageContext, Record<UserRole, SparkMessage | null>> = {
  "new-page": {
    creator: { text: "New hint!", emoji: "✨" },
    advertiser: null,
    admin: null,
    guest: null
  }
};
```

---

**Last Updated**: 2025-11-28  
**Version**: 1.1  
**Maintainer**: Seeksy Development Team

---

## Integration Status

### ✅ Completed
- [x] Generated 20 character assets (base, dark, holiday, icons)
- [x] Built core Spark component library (SparkAvatar, SparkEmptyState, SparkWelcomeModal, SparkSnowfall)
- [x] Created utility system (theme detection, asset selection, personality layer, context hints)
- [x] Updated SeeksyAIChatWidget with Spark avatars and branding
- [x] Added "Ask Spark" sidebar button with custom event trigger
- [x] Integrated keyboard shortcut (Cmd/Ctrl+Shift+S) for chat widget
- [x] Added SparkSnowfall to App.tsx root (auto-activates Dec 1-31)
- [x] Integrated SparkWelcomeModal into Dashboard onboarding flow
- [x] Replaced CFO AI assistant icon with Spark avatar
- [x] Created comprehensive documentation (SPARK_INTEGRATION_OVERVIEW.md, SPARK_COMPONENT_LIBRARY.md)

### 🔄 In Progress
- [ ] Replace AI avatars in Advertiser tools (Script Generator, Campaign Helper)
- [ ] Replace AI avatars in Admin tools (Rate Desk Assistant, Financial Models)
- [ ] Integrate SparkEmptyState across platform empty states

### 📋 Planned
- [ ] Add Spark tooltips in Podcast Studio
- [ ] Add Spark hints in My Page builder
- [ ] Add Spark tips in Advertiser onboarding
- [ ] Voice Certification AI screens integration
- [ ] Context-aware hints in all major workflows
