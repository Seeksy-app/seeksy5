# ALCHIFY WHITE-LABEL MVP - COMPLETE SPECIFICATION

> **Copy this entire document to the Alchify project's Custom Knowledge (Settings → Manage Knowledge)**

---

# PART 1: WHITE-LABEL ARCHITECTURE

## Overview

This document defines the reusable white-label architecture for Seeksy-based products. Alchify is the first implementation, but this pattern will be used for future partners.

## 1. Multi-Tenant Configuration Structure

### 1.1 Tenant Config Type Definition

```typescript
// src/types/tenant.ts

export interface TenantConfig {
  // Core identification
  id: string;                    // 'alchify', 'seeksy', 'partner-x'
  name: string;                  // Display name
  tagline: string;               // Brand tagline
  domain: string;                // Primary domain
  
  // Branding
  branding: {
    logo: string;                // Path to logo SVG
    logoMark: string;            // Path to icon-only mark
    favicon: string;             // Path to favicon
    colors: TenantColors;        // Color palette
    fonts: TenantFonts;          // Typography
    borderRadius: string;        // Global border radius
  };
  
  // Feature modules
  modules: Record<string, boolean>;
  
  // Navigation
  navigation: {
    layout: 'sidebar' | 'topbar' | 'hybrid';
    items: NavItem[];
  };
  
  // AI Agent configuration
  aiAgent: {
    name: string;                // 'Refiner AI', 'Spark', etc.
    persona: string;             // Persona key for KB lookup
    avatar: string;              // Path to agent avatar
    greeting: string;            // Initial message
    systemPrompt: string;        // Full system prompt
    capabilities: string[];      // List of capabilities
    ui: 'slide-out' | 'modal' | 'inline' | 'page';
  };
  
  // Feature flags
  features: Record<string, boolean>;
  
  // Auth configuration
  auth: {
    providers: ('email' | 'google' | 'github' | 'apple')[];
    requireEmailVerification: boolean;
    allowSignup: boolean;
  };
}

export interface TenantColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
}

export interface TenantFonts {
  heading: string;
  body: string;
}

export interface NavItem {
  id?: string;
  label?: string;
  icon?: string;
  path?: string;
  divider?: boolean;
}
```

### 1.2 Config File Location

```
src/
├── config/
│   ├── tenants/
│   │   ├── alchify.config.ts      # Alchify-specific config
│   │   ├── seeksy.config.ts       # Seeksy core config
│   │   └── index.ts               # Config loader
│   └── tenant.ts                  # Current tenant config export
```

### 1.3 Config Loader

```typescript
// src/config/tenants/index.ts

import { TenantConfig } from '@/types/tenant';
import { alchifyConfig } from './alchify.config';
import { seeksyConfig } from './seeksy.config';

const TENANT_CONFIGS: Record<string, TenantConfig> = {
  alchify: alchifyConfig,
  seeksy: seeksyConfig,
};

export function getTenantConfig(): TenantConfig {
  // Determine tenant from domain or environment
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Check domain mapping
  if (domain.includes('alchify') || domain.includes('alchifydemo')) {
    return TENANT_CONFIGS.alchify;
  }
  
  // Check environment variable
  const envTenant = import.meta.env.VITE_TENANT_ID;
  if (envTenant && TENANT_CONFIGS[envTenant]) {
    return TENANT_CONFIGS[envTenant];
  }
  
  // Default to seeksy
  return TENANT_CONFIGS.seeksy;
}

export function getTenantById(id: string): TenantConfig | undefined {
  return TENANT_CONFIGS[id];
}
```

---

## 2. Theme System

### 2.1 CSS Variable Injection

```typescript
// src/lib/tenant-theme.ts

import { TenantConfig } from '@/types/tenant';

export function applyTenantTheme(config: TenantConfig): void {
  const root = document.documentElement;
  const { colors, fonts, borderRadius } = config.branding;
  
  // Apply colors
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--${camelToKebab(key)}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Apply fonts
  root.style.setProperty('--font-heading', fonts.heading);
  root.style.setProperty('--font-body', fonts.body);
  
  // Apply border radius
  root.style.setProperty('--radius', borderRadius);
  
  // Update document title
  document.title = config.name;
  
  // Update favicon
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = config.branding.favicon;
  }
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
```

### 2.2 Tenant Context Provider

```typescript
// src/contexts/TenantContext.tsx

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { TenantConfig } from '@/types/tenant';
import { getTenantConfig } from '@/config/tenants';
import { applyTenantTheme } from '@/lib/tenant-theme';

interface TenantContextType {
  config: TenantConfig;
  isModule: (moduleId: string) => boolean;
  isFeature: (featureId: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const config = getTenantConfig();
  
  useEffect(() => {
    applyTenantTheme(config);
  }, [config]);
  
  const isModule = (moduleId: string) => config.modules[moduleId] === true;
  const isFeature = (featureId: string) => config.features[featureId] === true;
  
  return (
    <TenantContext.Provider value={{ config, isModule, isFeature }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

---

## 3. Module System

### 3.1 Module Registry

```typescript
// src/config/modules.ts

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  routes: RouteConfig[];
  navItem?: NavItem;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'studio',
    name: 'Studio',
    description: 'Recording and streaming studio',
    routes: [
      { path: '/studio', component: 'StudioPage' },
      { path: '/studio/:sessionId', component: 'StudioSession' },
    ],
    navItem: { id: 'studio', label: 'Studio', icon: 'Video', path: '/studio' },
  },
  {
    id: 'refiner',
    name: 'Refiner',
    description: 'Content refinement and cleanup',
    routes: [
      { path: '/refiner', component: 'RefinerPage' },
      { path: '/refiner/:projectId', component: 'RefinerEditor' },
    ],
    navItem: { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
  },
  // ... other modules
];
```

### 3.2 Conditional Route Loader

```typescript
// src/router/TenantRouter.tsx

import { useTenant } from '@/contexts/TenantContext';
import { MODULE_REGISTRY } from '@/config/modules';

export function TenantRouter() {
  const { config, isModule } = useTenant();
  
  // Filter modules based on tenant config
  const enabledModules = MODULE_REGISTRY.filter(m => isModule(m.id));
  
  // Build routes from enabled modules
  const routes = enabledModules.flatMap(m => m.routes);
  
  return (
    <Routes>
      {routes.map(route => (
        <Route 
          key={route.path} 
          path={route.path} 
          element={<LazyComponent name={route.component} />} 
        />
      ))}
    </Routes>
  );
}
```

---

## 4. AI Agent Isolation

### 4.1 Tenant-Scoped AI Agent

```typescript
// src/components/ai/TenantAIAgent.tsx

import { useTenant } from '@/contexts/TenantContext';
import { AIAgentPanel } from './AIAgentPanel';

export function TenantAIAgent() {
  const { config } = useTenant();
  const { aiAgent } = config;
  
  if (aiAgent.ui === 'slide-out') {
    return (
      <AIAgentPanel
        name={aiAgent.name}
        avatar={aiAgent.avatar}
        greeting={aiAgent.greeting}
        systemPrompt={aiAgent.systemPrompt}
        capabilities={aiAgent.capabilities}
      />
    );
  }
  
  // Other UI modes...
  return null;
}
```

### 4.2 Edge Function with Tenant Context

```typescript
// supabase/functions/tenant-ai-chat/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TENANT_PROMPTS: Record<string, string> = {
  alchify: `You are Refiner AI, the Alchify content transformation assistant...`,
  seeksy: `You are Spark, the Seeksy AI co-pilot...`,
};

serve(async (req) => {
  const { messages, tenantId } = await req.json();
  
  const systemPrompt = TENANT_PROMPTS[tenantId] || TENANT_PROMPTS.seeksy;
  
  // Call AI with tenant-specific system prompt
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });
  
  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## 5. Data Isolation

### 5.1 Tenant ID in Tables

All core tables include a `tenant_id` column:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,  -- 'alchify', 'seeksy', etc.
  user_id UUID REFERENCES auth.users(id),
  -- ... other columns
  
  CONSTRAINT projects_tenant_check CHECK (tenant_id IN ('alchify', 'seeksy'))
);

-- RLS policy example
CREATE POLICY "Users see own tenant data"
ON projects FOR SELECT
USING (
  auth.uid() = user_id 
  AND tenant_id = current_setting('app.tenant_id', true)
);
```

### 5.2 Tenant Context in Supabase Client

```typescript
// src/integrations/supabase/tenant-client.ts

import { supabase } from './client';
import { getTenantConfig } from '@/config/tenants';

export async function setTenantContext() {
  const config = getTenantConfig();
  
  // Set tenant context for RLS policies
  await supabase.rpc('set_tenant_context', { tenant_id: config.id });
}

// Call on app init
setTenantContext();
```

---

## 6. Domain & Auth Configuration

### 6.1 Environment Variables

```env
# .env for Alchify project
VITE_TENANT_ID=alchify
VITE_APP_DOMAIN=alchifydemo.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
```

### 6.2 Auth Provider Configuration

```typescript
// Auth is configured per-tenant in supabase dashboard
// Each tenant project has its own Supabase instance

// Login page reads tenant config for providers
const { config } = useTenant();
const providers = config.auth.providers;

// Render only enabled providers
{providers.includes('google') && <GoogleSignInButton />}
{providers.includes('email') && <EmailSignInForm />}
```

---

## 7. File Structure for White-Label Projects

```
alchify-project/
├── src/
│   ├── config/
│   │   ├── alchify.config.ts     # Tenant config
│   │   └── tenant.ts             # Config export
│   ├── contexts/
│   │   └── TenantContext.tsx     # Tenant provider
│   ├── lib/
│   │   └── tenant-theme.ts       # Theme injection
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TenantSidebar.tsx
│   │   │   └── TenantHeader.tsx
│   │   └── ai/
│   │       └── RefinerAIPanel.tsx
│   └── pages/
│       └── (tenant-specific pages)
├── public/
│   └── assets/
│       └── alchify/              # Tenant brand assets
│           ├── logo.svg
│           ├── mark.svg
│           └── favicon.ico
└── supabase/
    └── functions/
        └── alchify-*/            # Tenant-specific functions
```

---

---

# PART 2: ALCHIFY TENANT SPECIFICATION

## Overview

- **Tenant ID**: `alchify`
- **Name**: Alchify
- **Tagline**: "The Crucible for Creators"
- **Domain**: alchifydemo.com
- **Core Product**: Refiner AI – upload raw content → get polished, platform-ready assets

---

## 1. Alchify Configuration Object

```typescript
export const alchifyConfig: TenantConfig = {
  id: 'alchify',
  name: 'Alchify',
  tagline: 'The Crucible for Creators',
  domain: 'alchifydemo.com',
  
  branding: {
    logo: '/assets/alchify/logo.svg',
    logoMark: '/assets/alchify/mark.svg',
    favicon: '/assets/alchify/favicon.ico',
    colors: {
      // Gold/amber primary with dark background (crucible/alchemy theme)
      primary: 'hsl(45, 90%, 55%)',           // Warm gold
      primaryForeground: 'hsl(0, 0%, 5%)',
      secondary: 'hsl(220, 20%, 18%)',        // Dark slate
      accent: 'hsl(35, 85%, 50%)',            // Copper/bronze
      background: 'hsl(220, 25%, 6%)',        // Near black
      foreground: 'hsl(45, 10%, 95%)',        // Warm white
      muted: 'hsl(220, 15%, 12%)',
      mutedForeground: 'hsl(220, 10%, 55%)',
      border: 'hsl(220, 15%, 18%)',
      card: 'hsl(220, 20%, 10%)',
      cardForeground: 'hsl(45, 10%, 95%)',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    borderRadius: '0.625rem',
  },
  
  modules: {
    // Core Alchify features
    studio: true,
    refiner: true,
    transcription: true,
    clipGenerator: true,
    dashboard: true,
    analytics: true,
    integrations: true,
    
    // Disabled (not part of Alchify MVP)
    podcasts: false,
    meetings: false,
    events: false,
    crm: false,
    newsletter: false,
    monetization: false,
  },
  
  navigation: {
    layout: 'sidebar',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
      { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
      { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
      { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
      { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
      { divider: true },
      { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
  
  aiAgent: {
    name: 'Refiner AI',
    persona: 'alchify-refiner',
    avatar: '/assets/alchify/refiner-ai.svg',
    greeting: "Hey! I'm Refiner AI — ready to transform your raw content into polished, platform-ready assets. What are we working on today?",
    systemPrompt: ALCHIFY_AI_SYSTEM_PROMPT,  // See section 2
    capabilities: [
      'transcription',
      'filler-removal',
      'caption-sync',
      'format-conversion',
      'noise-reduction',
      'export-guidance',
    ],
    ui: 'slide-out',
  },
  
  features: {
    deepfakeProtection: true,
    blockchainCertification: false,  // Phase 2+
    factChecking: false,             // Phase 2+
    translations: false,             // Phase 2+
    aiDisclosure: true,
    watermarking: true,
  },
  
  auth: {
    providers: ['email', 'google'],
    requireEmailVerification: false,
    allowSignup: true,
  },
};
```

---

## 2. Refiner AI System Prompt

```typescript
const ALCHIFY_AI_SYSTEM_PROMPT = `You are Refiner AI, the Alchify content transformation assistant.

IDENTITY
- Name: Refiner AI
- Platform: Alchify ("The Crucible for Creators")
- Role: Help creators transform raw long-form content into polished, repurposed assets

CORE PRINCIPLES ("Alchify's Way")
1. NO deepfakes or synthetic faces/voices — we only refine real creators
2. Authenticity, attribution, and IP protection by default
3. Accessible outputs (captions, alt text, translations)
4. Transparency: never a black box; creators can see raw vs refined
5. Every edit is reversible and user-controlled

CAPABILITIES
- Transcription guidance (explain accuracy, confidence scores)
- Filler word detection and removal recommendations
- Caption sync and formatting
- Platform-specific format conversion (TikTok, Reels, Shorts, podcast)
- Noise reduction and audio cleanup guidance
- Export optimization tips

RESPONSE STYLE
- Concise and helpful (2-3 sentences typical)
- Technical when needed, friendly always
- Always explain what AI is doing and why
- Suggest next steps proactively

BOUNDARIES
- Never generate synthetic voices or faces
- Never claim to "create" content — you REFINE existing content
- Never make unverifiable claims about content
- Always disclose when AI assistance was used

When unsure, ask clarifying questions. Always prioritize creator control.`;
```

---

## 3. Module Feature Matrix

| Module | Enabled | MVP Scope |
|--------|---------|-----------|
| **Dashboard** | ✅ | Upload CTA, recent projects, revive content cards |
| **Upload** | ✅ | Drag-drop upload, file type validation, progress |
| **Projects** | ✅ | List view, status badges, quick actions |
| **Refiner Studio** | ✅ | Transcript editor, dual view, timeline, cleanup tools |
| **Transcription** | ✅ | Speech-to-text, confidence scoring, speaker labels |
| **Clip Generator** | ✅ | Auto-suggest clips, format presets, export |
| **Captions** | ✅ | Sync editor, burn-in toggle, SRT/WebVTT export |
| **Audio Cleanup** | ✅ | Noise reduction, normalization, ducking |
| **Exports** | ✅ | Format presets, download history, watermarking |
| **Integrations** | ✅ | YouTube, TikTok, Instagram, Substack stubs |
| **Analytics** | ✅ | Time saved, accuracy stats, usage metrics |
| **Settings** | ✅ | Profile, preferences, branding memory |

---

## 4. Database Tables (Alchify-Specific)

All tables include `tenant_id = 'alchify'` for isolation.

### Core Tables

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'uploaded',  -- uploaded, transcribing, editing, ready, exported
  source_file_url TEXT,
  source_file_type TEXT,  -- video, audio
  source_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transcripts
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  segments JSONB,  -- [{start, end, text, confidence, speaker}]
  avg_confidence DECIMAL(4,3),
  word_count INTEGER,
  filler_words_detected INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exports
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  format TEXT,  -- tiktok, reels, shorts, podcast, blog
  file_url TEXT,
  file_size_bytes BIGINT,
  includes_captions BOOLEAN DEFAULT false,
  includes_watermark BOOLEAN DEFAULT true,
  ai_disclosure BOOLEAN DEFAULT true,
  metadata JSONB,  -- creator_id, project_id, timestamp, version
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Action Log (Authenticity Layer)
CREATE TABLE ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT,  -- transcribe, remove_fillers, sync_captions, etc.
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Integrations (stub for OAuth tokens)
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT,  -- youtube, tiktok, instagram, substack
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  profile_data JSONB,
  connected_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Refiner Studio UI Components

### 5.1 Project Editor Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Projects          Project Title             [Export] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │                     │  │  Transcript Editor               │ │
│  │   Video Preview     │  │  ────────────────────────────    │ │
│  │   [Raw] [Refined]   │  │  00:00 - 00:05  "So, um, today  │ │
│  │                     │  │  we're going to talk about..."   │ │
│  │   ◄ ▶ ▶▶           │  │                                  │ │
│  │   0:00 / 5:32       │  │  00:05 - 00:12  "The main idea  │ │
│  │                     │  │  is that content creation..."    │ │
│  └─────────────────────┘  │                                  │ │
│                           │  [Filler words: 12] [Remove All] │ │
│  ┌─────────────────────┐  └──────────────────────────────────┘ │
│  │ Tools               │                                       │
│  │ • Filler Removal    │  ┌──────────────────────────────────┐ │
│  │ • Caption Sync      │  │  Captions Timeline               │ │
│  │ • Noise Reduction   │  │  ─────────────────────────────── │ │
│  │ • Format Convert    │  │  [======●==========]  2:15       │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💬 Refiner AI                                    [Expand] │ │
│  │ "I found 12 filler words. Want me to highlight them?"     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Cards

```tsx
// Dashboard layout
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Upload CTA */}
  <UploadCard />
  
  {/* Recent Projects */}
  <RecentProjectsCard projects={recentProjects} />
  
  {/* Revive Content (placeholder for analytics-driven suggestions) */}
  <ReviveContentCard />
</div>

{/* Quick Stats */}
<div className="grid grid-cols-4 gap-4 mt-6">
  <StatCard label="Time Saved" value="4.2 hrs" />
  <StatCard label="Projects" value="12" />
  <StatCard label="Exports" value="34" />
  <StatCard label="Avg Accuracy" value="96.2%" />
</div>
```

---

## 6. Integration Stubs (MVP)

| Platform | MVP Scope | Future |
|----------|-----------|--------|
| **YouTube** | OAuth connect + profile display | Direct upload |
| **TikTok** | OAuth connect + profile display | Direct upload |
| **Instagram** | OAuth connect + profile display | Direct upload |
| **Substack** | Manual export (formatted HTML) | API publish |

---

## 7. Analytics Metrics (MVP)

| Metric | Calculation |
|--------|-------------|
| **Time Saved** | Estimated based on content duration × 0.75 (manual edit baseline) |
| **Accuracy Score** | Average transcript confidence across all projects |
| **Projects Created** | Count of user's projects |
| **Exports Generated** | Count of completed exports |
| **Filler Words Removed** | Sum of filler_words_detected across projects |

---

## 8. Open Questions / Gaps

1. **Transcription Provider**: Spec mentions Deepgram — do we abstract this or commit to one provider?
   - Recommendation: Abstract with `TranscriptionService` interface

2. **Video Processing**: Auto-cropping and aspect conversion requires server-side video processing
   - Recommendation: Use Shotstack or similar; design hooks now, implement in Phase 2

3. **Branding Memory**: Spec mentions "upload sample past content"
   - Recommendation: MVP = metadata storage only; actual style matching is Phase 2+

4. **Blockchain Hooks**: Spec wants architecture hooks
   - Recommendation: Define `CertificationService` interface with `certify(projectId)` method

5. **Multi-language Captions**: Not in MVP but mentioned
   - Recommendation: Design for it (locale field in exports), implement later

---

---

# PART 3: IMPLEMENTATION PLAN

## Target: alchifydemo.com (Separate Lovable Project)

This plan outlines the step-by-step implementation for the Alchify white-label in its own Lovable project.

---

## Phase 1: Foundation & Auth (Day 1)

### 1.1 Project Setup
- [ ] Create new Lovable project at alchifydemo.com
- [ ] Enable Lovable Cloud (Supabase backend)
- [ ] Configure custom domain

### 1.2 Tenant Configuration
- [ ] Create `src/types/tenant.ts` (type definitions)
- [ ] Create `src/config/alchify.config.ts` (full config object)
- [ ] Create `src/contexts/TenantContext.tsx` (global provider)
- [ ] Implement `src/lib/tenant-theme.ts` (CSS variable injection)

### 1.3 Theming
- [ ] Update `index.css` with Alchify color variables (gold/dark theme)
- [ ] Update `tailwind.config.ts` with font configuration
- [ ] Add Alchify logo assets to `public/assets/alchify/`

### 1.4 Auth Shell
- [ ] Create `/auth` page with Alchify branding
- [ ] Email + Google sign-in (auto-confirm enabled)
- [ ] Basic profile creation on signup
- [ ] Auth guard for protected routes

### 1.5 Navigation Shell
- [ ] Create `TenantSidebar.tsx` driven by config
- [ ] Create `TenantHeader.tsx` with logo + user menu
- [ ] Implement layout wrapper

**Deliverable**: User can sign up, log in, see branded dashboard shell.

---

## Phase 2: Core Editing Pipeline (Days 2-3)

### 2.1 Upload Flow
- [ ] Create `/upload` page with drag-drop zone
- [ ] File type validation (video: mp4, mov, webm; audio: mp3, wav, m4a)
- [ ] Upload to Supabase storage bucket
- [ ] Create project record in `projects` table

### 2.2 Projects List
- [ ] Create `/projects` page
- [ ] Project cards with status badges
- [ ] Quick actions (Open, Delete, Export)
- [ ] Empty state with upload CTA

### 2.3 Transcription Engine
- [ ] Create `transcribe-audio` edge function
- [ ] Integrate with transcription provider (OpenAI Whisper via Lovable AI)
- [ ] Return segments with confidence scores
- [ ] Store in `transcripts` table

### 2.4 Refiner Studio - Transcript Editor
- [ ] Create `/refiner/:projectId` page
- [ ] Split layout: video preview + transcript editor
- [ ] Segment-by-segment display with timestamps
- [ ] Confidence highlighting (low confidence = yellow)
- [ ] Editable text fields

### 2.5 Filler Word Detection
- [ ] Detect common fillers: "um", "uh", "like", "you know", "so", "basically"
- [ ] Highlight fillers in transcript
- [ ] "Remove All Fillers" one-click action
- [ ] Count badge in toolbar

### 2.6 Dual View (Raw vs Refined)
- [ ] Toggle between original and cleaned transcript
- [ ] Visual diff highlighting (strikethrough removed words)
- [ ] Sync scroll position between views

**Deliverable**: User uploads content, gets transcript, can clean up fillers, see before/after.

---

## Phase 3: Authenticity Layer (Day 4)

### 3.1 AI Action Logging
- [ ] Create `ai_action_log` table
- [ ] Log all AI operations: transcribe, remove_fillers, sync_captions, etc.
- [ ] Include user_id, project_id, action_type, details, timestamp
- [ ] Display action history in project settings

### 3.2 No-Deepfake Constraints
- [ ] UI explicitly states "Real creators only"
- [ ] No voice cloning or face generation features
- [ ] Clear messaging in AI agent responses

### 3.3 Watermarking
- [ ] Add invisible metadata to exports: creator_id, project_id, timestamp, version
- [ ] "Processed by Alchify" tag
- [ ] Store metadata in `exports` table

### 3.4 AI Disclosure Toggle
- [ ] Export settings: "Include AI-assisted label" checkbox
- [ ] Default: true
- [ ] Store in export metadata

**Deliverable**: All AI actions logged, exports include provenance metadata.

---

## Phase 4: Captions & Export (Days 5-6)

### 4.1 Caption Sync Editor
- [ ] Timeline component showing caption segments
- [ ] Drag to adjust segment timing
- [ ] Click to edit text
- [ ] Playhead sync with video preview

### 4.2 Caption Styling
- [ ] Font selection (subset of safe fonts)
- [ ] Case style: UPPERCASE, lowercase, Title Case
- [ ] Position: top, center, bottom
- [ ] Save as caption template

### 4.3 Export Formats
- [ ] Platform presets:
  - TikTok (9:16, 60s max, burned captions)
  - YouTube Shorts (9:16, 60s max)
  - Instagram Reels (9:16, 90s max)
  - Podcast Audio (mp3, normalized)
  - Blog Post (formatted transcript text)
- [ ] Download SRT/WebVTT subtitle files

### 4.4 Export Flow
- [ ] Format selection modal
- [ ] Caption options (burn-in vs. separate file)
- [ ] Watermark toggle
- [ ] AI disclosure toggle
- [ ] Processing indicator
- [ ] Download link + export history

### 4.5 Audio Cleanup
- [ ] One-click noise reduction (via edge function)
- [ ] Volume normalization
- [ ] Preview before/after audio

**Deliverable**: User can export polished content in multiple formats with captions.

---

## Phase 5: Dashboard & Analytics (Day 7)

### 5.1 Dashboard Layout
- [ ] Hero upload CTA card
- [ ] Recent projects grid (last 6)
- [ ] "Revive Content" placeholder cards
- [ ] Quick stats row

### 5.2 Analytics Page
- [ ] Time Saved calculation
- [ ] Projects created count
- [ ] Exports generated count
- [ ] Average accuracy score
- [ ] Filler words removed total
- [ ] Simple charts (bar or line)

### 5.3 Branding Memory (Stub)
- [ ] Settings page with "Upload sample content" section
- [ ] Store metadata only (file list, not actual style extraction)
- [ ] Display as "Connected content" list

**Deliverable**: Dashboard shows useful metrics, analytics page tracks progress.

---

## Phase 6: Refiner AI Agent (Day 8)

### 6.1 Slide-Out Panel
- [ ] Create `RefinerAIPanel.tsx` (slide-out from right)
- [ ] Floating button in corner
- [ ] Open/close animation
- [ ] Persists across page navigation

### 6.2 AI Chat Interface
- [ ] Message input with send button
- [ ] Chat history display
- [ ] Typing indicator
- [ ] Quick action buttons

### 6.3 Edge Function
- [ ] Create `alchify-refiner-ai` edge function
- [ ] Use Alchify system prompt
- [ ] Context-aware (current project, transcript status)
- [ ] Suggest next actions

### 6.4 Contextual Suggestions
- [ ] On project open: "I found X filler words. Want me to highlight them?"
- [ ] After transcript: "Ready to sync captions?"
- [ ] Before export: "Which platform are you targeting?"

**Deliverable**: Refiner AI assistant accessible throughout the app.

---

## Phase 7: Integrations (Day 9)

### 7.1 Integration Page
- [ ] Create `/integrations` page
- [ ] Cards for YouTube, TikTok, Instagram, Substack
- [ ] "Connect" button for each
- [ ] Status indicator (connected/not connected)

### 7.2 OAuth Stubs
- [ ] YouTube OAuth flow (client-side redirect, store token)
- [ ] TikTok OAuth flow
- [ ] Instagram OAuth flow
- [ ] Display connected profile info

### 7.3 Substack Export
- [ ] Format transcript as clean HTML
- [ ] "Copy to clipboard" for manual paste
- [ ] Future: direct API publish

**Deliverable**: Users can connect accounts, see integration status.

---

## Phase 8: Polish & Alpha Prep (Day 10)

### 8.1 Error Handling
- [ ] Toast notifications for all actions
- [ ] Error boundaries
- [ ] Loading states throughout

### 8.2 Empty States
- [ ] No projects yet → Upload CTA
- [ ] No exports yet → Create first export CTA
- [ ] No integrations → Connect accounts CTA

### 8.3 Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Collapsible sidebar
- [ ] Responsive video preview

### 8.4 Performance
- [ ] Lazy load heavy components
- [ ] Optimize transcript rendering for long content
- [ ] Prefetch common routes

### 8.5 Alpha Testing Prep
- [ ] Create test accounts
- [ ] Seed sample projects
- [ ] Document known limitations
- [ ] Prepare feedback form

**Deliverable**: Alpha-ready product for 50-100 creators.

---

## Code Reuse from Seeksy

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| **Auth flow** | High | Same pattern, different branding |
| **File upload** | High | Existing upload components |
| **Transcription** | High | Existing Whisper integration |
| **Video player** | Medium | May need custom controls |
| **AI agent UI** | High | Existing slide-out pattern |
| **Dashboard layout** | Medium | Different card content |
| **Database patterns** | High | Same RLS patterns + tenant_id |
| **Edge function patterns** | High | Same CORS, auth patterns |

---

## Timeline Summary

| Phase | Days | Focus |
|-------|------|-------|
| 1 | 1 | Foundation & Auth |
| 2 | 2-3 | Core Pipeline |
| 3 | 4 | Authenticity |
| 4 | 5-6 | Captions & Export |
| 5 | 7 | Dashboard & Analytics |
| 6 | 8 | AI Agent |
| 7 | 9 | Integrations |
| 8 | 10 | Polish |

**Total: ~10 working days to Alpha-ready MVP**

---

## Next Steps

1. Open alchifydemo.com Lovable project
2. Enable Lovable Cloud
3. Start with Phase 1: Foundation & Auth
4. Reference this doc for patterns

Ready to begin when you open the Alchify project!
