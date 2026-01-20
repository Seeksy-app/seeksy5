# Seeksy Santa Holiday System

## Overview
The Seeksy Santa Holiday System transforms the Seeksy platform with festive seasonal features during the holiday season (November 25 - January 2).

## Components

### 1. Seeksy Santa Avatar
- **Location**: `src/components/spark/SparkAvatar.tsx`
- **Assets**: Flat, transparent Spark character with Santa hat
- **Animations**:
  - Initial load: 1.5s gentle bounce animation
  - Hover: Scale + brightness effect
  - No constant bouncing (performance optimized)

### 2. Holiday Mode System
- **Configuration**: `src/lib/spark/holidayMode.ts`
- **Global Flag**: `localStorage.getItem("seeksy_holiday_mode")`
- **Auto-activation**: Enabled during holiday season unless explicitly disabled
- **Features**:
  - Seeksy Santa replaces standard Spark
  - Subtle snowfall on dashboards
  - Holiday-themed accents

### 3. Seeksy Santa Surprise Modal
- **Component**: `src/components/spark/SeeksySantaSurprise.tsx`
- **Widget**: `src/components/spark/SeeksySantaWidget.tsx`
- **Location**: Bottom-right floating button
- **Actions**:
  - Generate holiday-themed clips
  - Create holiday banners
  - AI holiday blog post
  - Routes to existing tools with festive context

### 4. Face Registration Foundation
- **Table**: `creator_faces`
- **Dialog**: `src/components/face-registration/RegisterFaceDialog.tsx`
- **Edge Function**: `supabase/functions/generate-face-embedding/index.ts`
- **Features**:
  - Upload still image OR webcam capture
  - AI-powered facial feature extraction via Gemini Vision
  - Store embeddings + thumbnails
  - RLS policies for creator ownership

## Database Schema

```sql
CREATE TABLE public.creator_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Usage

### Enable/Disable Holiday Mode
```typescript
import { toggleHolidayMode, isHolidayModeEnabled } from "@/lib/spark/holidayMode";

// Check status
const isEnabled = isHolidayModeEnabled();

// Toggle
toggleHolidayMode();
```

### Register a Face
```typescript
import { RegisterFaceDialog } from "@/components/face-registration/RegisterFaceDialog";

<RegisterFaceDialog open={open} onOpenChange={setOpen} />
```

### Use Seeksy Santa Avatar
```typescript
import { SparkAvatar } from "@/components/spark/SparkAvatar";

// Automatically displays Santa during holiday season
<SparkAvatar pose="waving" size={80} animated />
```

## Animation Classes

### Tailwind
- `animate-bounce-gentle` - Gentle 1.5s bounce
- `animate-float` - 3s floating effect

### CSS
```css
@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}
```

## Future Enhancements

### Phase 2: Face-Based Features
- Creator identity protection
- Facial ad attribution tracking
- Face-based search across platform
- "Find My Seeksy Santa Moment" highlights
- Deepfake detection

### Phase 3: Expanded Holiday Features
- Holiday banners with AI generation
- Holiday clip presets (festive transitions, effects)
- Holiday blog automation
- Santa-mode homepage tiles
- Face + voice identity hub

## Performance Considerations

- Snowfall: CSS-only, minimal performance impact
- Avatar: Static PNG images, no video/complex animations
- Face registration: Edge function processing, no client overhead
- Holiday mode: localStorage flag, instant toggle

## Security

- Face embeddings stored with RLS policies
- Creator-only access to own face data
- Admins can view all registrations for moderation
- No face matching logic exposed to client

## File Structure

```
src/
├── components/
│   ├── spark/
│   │   ├── SparkAvatar.tsx (updated with animations)
│   │   ├── SeeksySantaWidget.tsx
│   │   ├── SeeksySantaSurprise.tsx
│   │   └── SparkSnowfall.tsx
│   └── face-registration/
│       └── RegisterFaceDialog.tsx
├── lib/
│   └── spark/
│       ├── sparkAssets.ts
│       └── holidayMode.ts
└── styles/
    └── sparkSnowfall.css

supabase/
└── functions/
    └── generate-face-embedding/
        └── index.ts
```

## Testing

1. **Holiday Mode**: Set date to December 1-31
2. **Santa Widget**: Check bottom-right for floating Santa
3. **Face Registration**: Upload test image, verify embedding storage
4. **Animations**: Verify load bounce + hover effects
5. **Snowfall**: Enable on dashboard pages only

---

**Version**: 1.0.0  
**Last Updated**: November 28, 2024  
**Maintained By**: Seeksy Engineering Team
