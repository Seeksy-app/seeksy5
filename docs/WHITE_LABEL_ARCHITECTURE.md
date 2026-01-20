# White-Label Architecture Guide

## Overview

This document defines the reusable white-label framework for Seeksy partners. Each tenant (Alchify, future partners) shares the core platform codebase but runs with isolated branding, modules, data, and AI personas.

---

## 1. Multi-Tenant Configuration

### Config File Structure

Each tenant has a configuration file: `src/config/tenants/{tenant-id}.config.ts`

```typescript
// src/config/tenants/alchify.config.ts
import { TenantConfig } from '@/types/tenant';

export const alchifyConfig: TenantConfig = {
  id: 'alchify',
  name: 'Alchify',
  tagline: 'The Crucible for Creators',
  domain: 'alchifydemo.com',
  
  // Branding
  branding: {
    logo: '/assets/alchify-logo.svg',
    logoMark: '/assets/alchify-mark.svg',
    favicon: '/assets/alchify-favicon.ico',
    colors: {
      primary: 'hsl(45, 90%, 55%)',      // Gold/amber
      primaryForeground: 'hsl(0, 0%, 10%)',
      secondary: 'hsl(220, 15%, 20%)',
      accent: 'hsl(45, 80%, 60%)',
      background: 'hsl(220, 15%, 8%)',
      foreground: 'hsl(0, 0%, 95%)',
      muted: 'hsl(220, 10%, 15%)',
      mutedForeground: 'hsl(220, 10%, 60%)',
      border: 'hsl(220, 10%, 20%)',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    borderRadius: '0.5rem',
  },
  
  // Enabled modules
  modules: {
    studio: true,
    refiner: true,           // Core Alchify feature
    transcription: true,
    clipGenerator: true,
    dashboard: true,
    analytics: true,
    integrations: true,
    // Disabled for Alchify
    podcasts: false,
    meetings: false,
    events: false,
    crm: false,
    newsletter: false,
    monetization: false,
  },
  
  // Navigation layout
  navigation: {
    layout: 'sidebar',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
      { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
      { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
      { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
      { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
      { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
  
  // AI Agent configuration
  aiAgent: {
    name: 'Refiner AI',
    persona: 'alchify-refiner',
    avatar: '/assets/refiner-ai-avatar.svg',
    greeting: "Hi! I'm Refiner AI, your content transformation assistant. Upload your raw content and I'll help you create polished, platform-ready assets.",
    systemPrompt: `You are Refiner AI, the Alchify content assistant.
Your role is to help creators transform raw long-form content into polished, repurposed assets.

Core principles ("Alchify's Way"):
- No deepfakes or synthetic faces/voices - we only refine real creators
- Authenticity, attribution, and IP protection by default
- Accessible outputs (captions, alt text, translations)
- Transparency: never a black box; creators can see raw vs refined

You can help with:
- Transcription and cleanup
- Filler word removal
- Caption generation and sync
- Format conversion for different platforms
- Export guidance

Always be concise, helpful, and transparent about what AI is doing.`,
    capabilities: ['transcription', 'cleanup', 'captions', 'formatting', 'export'],
    ui: 'slide-out',  // 'slide-out' | 'modal' | 'page'
  },
  
  // Feature flags
  features: {
    deepfakeProtection: true,
    blockchainCertification: false,  // Future phase
    factChecking: false,             // Future phase
    translations: false,             // Future phase
    aiDisclosure: true,
    watermarking: true,
  },
  
  // Auth configuration
  auth: {
    providers: ['email', 'google'],
    requireEmailVerification: false,  // For alpha
    allowSignup: true,
  },
};
```

### Type Definitions

```typescript
// src/types/tenant.ts
export interface TenantConfig {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  branding: TenantBranding;
  modules: TenantModules;
  navigation: TenantNavigation;
  aiAgent: TenantAIAgent;
  features: TenantFeatures;
  auth: TenantAuth;
}

export interface TenantBranding {
  logo: string;
  logoMark: string;
  favicon: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string;
}

export interface TenantModules {
  studio: boolean;
  refiner: boolean;
  transcription: boolean;
  clipGenerator: boolean;
  dashboard: boolean;
  analytics: boolean;
  integrations: boolean;
  podcasts: boolean;
  meetings: boolean;
  events: boolean;
  crm: boolean;
  newsletter: boolean;
  monetization: boolean;
}

export interface TenantNavigation {
  layout: 'sidebar' | 'topnav' | 'hybrid';
  items: Array<{
    id: string;
    label: string;
    icon: string;
    path: string;
    children?: Array<{ id: string; label: string; path: string }>;
  }>;
}

export interface TenantAIAgent {
  name: string;
  persona: string;
  avatar: string;
  greeting: string;
  systemPrompt: string;
  capabilities: string[];
  ui: 'slide-out' | 'modal' | 'page';
}

export interface TenantFeatures {
  deepfakeProtection: boolean;
  blockchainCertification: boolean;
  factChecking: boolean;
  translations: boolean;
  aiDisclosure: boolean;
  watermarking: boolean;
}

export interface TenantAuth {
  providers: Array<'email' | 'google' | 'github' | 'sso'>;
  requireEmailVerification: boolean;
  allowSignup: boolean;
}
```

---

## 2. Theme System

### CSS Variable Injection

The tenant config colors are injected as CSS variables at runtime:

```typescript
// src/lib/tenant-theme.ts
import { TenantBranding } from '@/types/tenant';

export function injectTenantTheme(branding: TenantBranding) {
  const root = document.documentElement;
  
  // Inject color variables
  Object.entries(branding.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Inject font variables
  root.style.setProperty('--font-heading', branding.fonts.heading);
  root.style.setProperty('--font-body', branding.fonts.body);
  root.style.setProperty('--radius', branding.borderRadius);
}
```

### Usage in Components

```tsx
// Components use semantic tokens, not hardcoded colors
<Button className="bg-primary text-primary-foreground">
  Upload Content
</Button>
```

---

## 3. Module Loader / Feature Flags

### Route Gating

```typescript
// src/lib/module-loader.ts
import { TenantConfig } from '@/types/tenant';

export function isModuleEnabled(config: TenantConfig, moduleId: string): boolean {
  return config.modules[moduleId as keyof TenantModules] ?? false;
}

export function getEnabledNavItems(config: TenantConfig) {
  return config.navigation.items.filter(item => {
    // Map nav items to module flags
    const moduleMap: Record<string, keyof TenantModules> = {
      'refiner': 'refiner',
      'projects': 'refiner',
      'analytics': 'analytics',
      'integrations': 'integrations',
    };
    const moduleId = moduleMap[item.id];
    return !moduleId || isModuleEnabled(config, moduleId);
  });
}
```

### Conditional Route Rendering

```tsx
// src/App.tsx or router config
function AppRoutes() {
  const { config } = useTenant();
  
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {config.modules.refiner && (
        <Route path="/refiner/*" element={<RefinerStudio />} />
      )}
      {config.modules.analytics && (
        <Route path="/analytics" element={<Analytics />} />
      )}
      {/* ... */}
    </Routes>
  );
}
```

---

## 4. AI Agent Isolation

### Agent Context Provider

```typescript
// src/contexts/TenantAIContext.tsx
import { createContext, useContext } from 'react';
import { TenantAIAgent } from '@/types/tenant';

interface TenantAIContextType {
  agent: TenantAIAgent;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  sendMessage: (message: string) => Promise<string>;
}

const TenantAIContext = createContext<TenantAIContextType | null>(null);

export function TenantAIProvider({ children, agentConfig }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  const sendMessage = async (message: string) => {
    // Call edge function with tenant-scoped system prompt
    const response = await supabase.functions.invoke('tenant-ai-agent', {
      body: {
        message,
        tenantId: agentConfig.persona,
        systemPrompt: agentConfig.systemPrompt,
      },
    });
    return response.data.reply;
  };
  
  return (
    <TenantAIContext.Provider value={{
      agent: agentConfig,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      sendMessage,
    }}>
      {children}
      {agentConfig.ui === 'slide-out' && <AISlideOutPanel />}
    </TenantAIContext.Provider>
  );
}
```

### Edge Function with Tenant Scope

```typescript
// supabase/functions/tenant-ai-agent/index.ts
serve(async (req) => {
  const { message, tenantId, systemPrompt } = await req.json();
  
  // Fetch tenant-specific knowledge base
  const { data: kbChunks } = await supabase
    .from('tenant_knowledge_base')
    .select('content')
    .eq('tenant_id', tenantId)
    .limit(10);
  
  const contextualPrompt = `
${systemPrompt}

Relevant knowledge:
${kbChunks?.map(c => c.content).join('\n')}
`;
  
  // Call AI with tenant-scoped context
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: contextualPrompt },
        { role: 'user', content: message },
      ],
    }),
  });
  
  // Return response
});
```

---

## 5. Data Isolation

### Database Schema Pattern

All tenant-shared tables include `tenant_id`:

```sql
-- Example: projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,  -- 'alchify', 'seeksy', etc.
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMPTZ DEFAULT now(),
  -- ...
);

-- RLS policy ensures tenant isolation
CREATE POLICY "Users can only see their tenant's projects"
ON projects FOR ALL
USING (
  tenant_id = current_setting('app.tenant_id', true)
  AND auth.uid() = user_id
);
```

### Setting Tenant Context

```typescript
// On app init, set tenant context for all queries
const { data } = await supabase.rpc('set_tenant_context', { 
  tenant_id: config.id 
});
```

---

## 6. File Structure

```
src/
├── config/
│   └── tenants/
│       ├── index.ts           # Tenant loader
│       ├── alchify.config.ts  # Alchify config
│       └── seeksy.config.ts   # Seeksy default config
├── types/
│   └── tenant.ts              # Type definitions
├── lib/
│   ├── tenant-theme.ts        # Theme injection
│   └── module-loader.ts       # Feature flag helpers
├── contexts/
│   ├── TenantContext.tsx      # Global tenant context
│   └── TenantAIContext.tsx    # AI agent context
├── components/
│   ├── tenant/
│   │   ├── TenantSidebar.tsx  # Config-driven sidebar
│   │   ├── TenantHeader.tsx   # Config-driven header
│   │   └── TenantAIPanel.tsx  # Slide-out AI agent
│   └── ...
└── ...
```

---

## 7. Deployment Pattern

### Single Codebase, Multiple Domains

1. **Build-time**: Tenant config baked into build via env variable
2. **Runtime**: Detect tenant from domain and load config
3. **Supabase**: Single project with tenant_id isolation

```typescript
// src/lib/detect-tenant.ts
export function detectTenant(): string {
  const domain = window.location.hostname;
  
  const tenantMap: Record<string, string> = {
    'alchifydemo.com': 'alchify',
    'app.seeksy.io': 'seeksy',
    'localhost': import.meta.env.VITE_DEFAULT_TENANT || 'seeksy',
  };
  
  return tenantMap[domain] || 'seeksy';
}
```

---

## 8. Adding a New White-Label Partner

1. Create `src/config/tenants/{partner}.config.ts`
2. Add branding assets to `/public/assets/{partner}/`
3. Add domain mapping to `detect-tenant.ts`
4. Seed `tenant_knowledge_base` with partner-specific content
5. Configure custom domain in Lovable project settings
6. Deploy

Estimated spin-up time: **2-4 hours** (vs days without this framework).
