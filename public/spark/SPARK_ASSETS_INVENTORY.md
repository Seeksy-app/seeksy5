# Spark Component Library Documentation

## Overview

The Spark Component Library provides reusable React components for integrating Seeksy Spark throughout the platform.

---

## Components

### SparkAvatar

Dynamic Spark character display with automatic theme and season detection.

**Import**:
```tsx
import { SparkAvatar } from "@/components/spark";
```

**Props**:
```tsx
interface SparkAvatarProps {
  pose?: "idle" | "happy" | "thinking" | "waving" | "idea" | "typing";
  size?: "full" | "icon-32" | "icon-20" | "icon-16" | number;
  className?: string;
  animated?: boolean;  // Hover scale effect
  onClick?: () => void;
  alt?: string;
}
```

**Examples**:
```tsx
// Basic usage
<SparkAvatar pose="idle" size={48} />

// With animation
<SparkAvatar pose="waving" size={64} animated />

// As clickable button
<SparkAvatar 
  pose="happy" 
  size="icon-32" 
  onClick={() => console.log("Spark clicked!")}
  animated
/>

// Full size in a container
<div className="w-32 h-32">
  <SparkAvatar pose="thinking" size="full" />
</div>
```

**Behavior**:
- Automatically switches assets based on:
  - Current theme (light/dark)
  - Current season (holiday mode in December)
- Uses MutationObserver to react to theme changes
- Preloads assets on mount for smooth experience

---

### SparkWelcomeModal

Onboarding modal for first-time users.

**Import**:
```tsx
import { SparkWelcomeModal } from "@/components/spark";
```

**Props**:
```tsx
interface SparkWelcomeModalProps {
  role: "creator" | "advertiser" | "admin" | "guest";
  onComplete: () => void;
}
```

**Example**:
```tsx
<SparkWelcomeModal 
  role="creator" 
  onComplete={() => console.log("Welcome completed")}
/>
```

**Behavior**:
- Shows once per user (localStorage: `spark_welcome_seen`)
- Displays role-specific onboarding message
- Features animated waving Spark
- Auto-opens 500ms after mount

**Role-Specific Messages**:
- **Creator**: "You're about to build your presence. Spark can help you set up your My Page, link your podcast, and launch your newsletter!"
- **Advertiser**: "Ready to launch your first campaign? Spark can walk you through creative options and match you to creators."
- **Admin**: "Spark can help you forecast revenue, build pricing models, or prep investor docs."

---

### SparkEmptyState

Empty state component with Spark character and helpful prompt.

**Import**:
```tsx
import { SparkEmptyState } from "@/components/spark";
```

**Props**:
```tsx
interface SparkEmptyStateProps {
  entityType: "episodes" | "campaigns" | "events" | "meetings" | "posts" | "contacts";
  role?: "creator" | "advertiser" | "admin" | "guest";
  onActionClick?: () => void;
  actionLabel?: string;
}
```

**Example**:
```tsx
{episodes.length === 0 && (
  <SparkEmptyState
    entityType="episodes"
    role="creator"
    onActionClick={() => navigate("/podcasts/create")}
    actionLabel="Create Your First Episode"
  />
)}
```

**Features**:
- Shows Spark in "thinking" pose
- Entity-specific encouragement message
- Optional CTA button
- Role-aware messaging

**Entity Messages**:
- **episodes**: "No episodes yet — Spark can help you create your first podcast script in minutes!"
- **campaigns**: "Ready to launch your first campaign? I'll walk you through it step-by-step!"
- **events**: "Let's create your first event! I can help you set up everything."
- **meetings**: "No meetings scheduled yet! Want me to help you set one up?"
- **posts**: "Your blog is empty! Let's write your first post together!"
- **contacts**: "Start building your network! I can help you organize your contacts."

---

### SparkSnowfall

Optional holiday snowfall overlay effect.

**Import**:
```tsx
import { SparkSnowfall } from "@/components/spark";
```

**Usage**:
```tsx
// Add to root layout
<SparkSnowfall />
```

**Behavior**:
- Auto-enables during December unless disabled
- Pure CSS animations (no JS loop)
- 9 snowflakes with staggered timing
- Respects `prefers-reduced-motion`

**User Control**:
```javascript
// Disable snowfall
localStorage.setItem("spark_snowfall_enabled", "false");

// Re-enable snowfall
localStorage.setItem("spark_snowfall_enabled", "true");
```

---

## Utilities

### sparkAssets.ts

**Functions**:

#### `isHolidaySeason()`
Returns `true` if current month is December.

```tsx
import { isHolidaySeason } from "@/lib/spark/sparkAssets";

if (isHolidaySeason()) {
  console.log("Show Santa Spark!");
}
```

#### `getCurrentTheme()`
Returns current theme: `"light"` or `"dark"`.

```tsx
import { getCurrentTheme } from "@/lib/spark/sparkAssets";

const theme = getCurrentTheme(); // "light" | "dark"
```

#### `getSparkAsset(pose, size, theme?, holiday?)`
Returns path to appropriate Spark asset.

```tsx
import { getSparkAsset } from "@/lib/spark/sparkAssets";

// Auto-detect theme + season
const assetPath = getSparkAsset("idle", "full");

// Force specific theme
const darkAsset = getSparkAsset("happy", "full", "dark", false);

// Icon size
const iconPath = getSparkAsset("idle", "icon-32");
```

#### `preloadSparkAssets()`
Preloads critical assets for faster rendering.

```tsx
import { preloadSparkAssets } from "@/lib/spark/sparkAssets";

useEffect(() => {
  preloadSparkAssets();
}, []);
```

---

### sparkPersonality.ts

**Functions**:

#### `getSparkGreeting(role)`
Returns role-specific welcome message.

```tsx
import { getSparkGreeting } from "@/lib/spark/sparkPersonality";

const greeting = getSparkGreeting("creator");
// { text: "Hi! I'm Seeksy Spark. Ready to create something amazing?", emoji: "✨" }
```

#### `getSparkContextHint(context, role)`
Returns page-aware helpful hint.

```tsx
import { getSparkContextHint } from "@/lib/spark/sparkPersonality";

const hint = getSparkContextHint("podcast", "creator");
// { text: "Try marking ad-break markers — Spark can auto-detect good clip moments! 🎙️✨", emoji: "🎙️" }
```

#### `getSparkEmptyStateMessage(entityType, role)`
Returns empty state encouragement.

```tsx
import { getSparkEmptyStateMessage } from "@/lib/spark/sparkPersonality";

const message = getSparkEmptyStateMessage("episodes", "creator");
// { text: "No episodes yet — Spark can help you create your first podcast script in minutes!", emoji: "🎙️" }
```

#### `getSparkOnboardingMessage(role)`
Returns onboarding welcome message.

```tsx
import { getSparkOnboardingMessage } from "@/lib/spark/sparkPersonality";

const onboarding = getSparkOnboardingMessage("advertiser");
// { text: "Ready to launch your first campaign? Spark can walk you through...", emoji: "🎯" }
```

---

## Hooks

### useSparkContextHints

Provides context-aware hints based on current route.

**Import**:
```tsx
import { useSparkContextHints } from "@/hooks/useSparkContextHints";
```

**Usage**:
```tsx
const { context, role, hint, hasHint } = useSparkContextHints();

{hasHint && hint && (
  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
    <SparkAvatar pose="idea" size={32} />
    <p className="text-sm">
      {hint.emoji} {hint.text}
    </p>
  </div>
)}
```

**Returns**:
```tsx
{
  context: PageContext;    // Current page context
  role: UserRole;          // User's role
  hint: SparkMessage | null;  // Context hint (if available)
  hasHint: boolean;        // Whether hint exists
}
```

---

## Design System Integration

### Colors (from Character Guide)
```css
--spark-primary: #F9D54A;      /* Yellow */
--spark-gold: #F7A928;          /* Gold gradient bottom */
--spark-outline: #7A4A25;       /* Brown outline */
--spark-eye: #3A2D1E;           /* Dark brown eyes */
--spark-blush: #F3A6A0;         /* Pink cheeks */
--spark-glow: #52A7FF;          /* AI glow (dark mode) */
--spark-santa-red: #FF426A;     /* Santa hat */
```

### Animation Timing
- **Hover scale**: 200ms ease-out
- **Float entrance**: 180ms ease-out  
- **Pop-in**: Scale from 90% to 100% with slight bounce
- **Typing indicator**: Continuous subtle animation

---

## Best Practices

### DO
✅ Use `SparkAvatar` for all Spark displays  
✅ Let automatic theme/season detection work  
✅ Provide meaningful `alt` text  
✅ Use context hints to guide users  
✅ Preload assets in parent components  

### DON'T
❌ Hardcode asset paths (use `getSparkAsset()`)  
❌ Override automatic theme detection without reason  
❌ Use Spark outside of AI/help contexts  
❌ Animate excessively (keep it subtle)  
❌ Display multiple Sparks simultaneously  

---

## Accessibility

- All Spark images include descriptive `alt` text
- Snowfall respects `prefers-reduced-motion`
- Keyboard navigation supported (Tab, Enter, Space)
- ARIA labels on interactive elements
- Sufficient color contrast in all themes

---

## Performance

- **Asset Size**: 50-150KB per PNG (optimized)
- **Preloading**: Only critical assets preloaded
- **Animation**: CSS-only (no JavaScript loops)
- **Lazy Loading**: Non-critical assets load on-demand
- **Theme Detection**: MutationObserver (minimal overhead)

---

## Troubleshooting

### Spark Not Changing Theme
**Fix**: Verify `data-theme` or `.dark` class exists on `<html>` element.

### Holiday Assets Not Loading
**Check**: 
1. Current month is December
2. Assets exist in `public/spark/holiday/`
3. `localStorage.getItem("spark_holiday_mode")` !== `"disabled"`

### Animations Not Working
**Verify**:
1. `animated` prop is set to `true`
2. User hasn't disabled animations system-wide
3. CSS transitions are not blocked by other styles

---

**Version**: 1.0  
**Last Updated**: 2025-11-28  
**See Also**: SPARK_INTEGRATION_OVERVIEW.md