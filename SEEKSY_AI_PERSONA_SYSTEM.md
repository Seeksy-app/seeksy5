# Seeksy AI Persona System V2.0

## Overview

The Seeksy AI Persona System is a comprehensive, context-aware agent architecture that routes user queries to specialized AI personas, each with domain expertise in specific platform modules.

## Architecture

### Global Agent (`global-agent` edge function)
- **Entry Point**: All AI requests route through the Global Agent
- **Smart Routing**: Detects appropriate persona based on:
  - Current route/page context
  - Message keywords
  - User intent
- **Orchestration**: Can combine multiple personas for complex requests
- **Fallback**: Returns general assistance if no specific persona matches

### Specialized Personas

#### 1. **Scribe** - Email & Communications Intelligence
**Route**: `/email`, `/campaigns`, `/templates`  
**Edge Function**: `scribe-agent`

**Capabilities**:
- Draft complete emails with subject/preheader/body
- Rewrite existing emails for tone/clarity
- Generate subject line alternatives
- Check deliverability (spam triggers, formatting)
- Personalize based on contact data
- Add merge tags automatically

**Data Access**:
- `contacts`, `contact_preferences`
- `email_campaigns`, `email_events`
- `profiles` (for sender info)

**Actions**:
- `draft` - Generate new email from prompt
- `rewrite` - Improve existing email
- `personalize` - Add contact-specific content
- `check_deliverability` - Analyze for spam triggers
- `improve_subject` - Generate subject alternatives

#### 2. **Mia** - Meetings & Events Coordinator
**Route**: `/meetings`, `/events`, `/calendar`

**Capabilities**:
- Schedule meetings and events
- Draft meeting invitations
- Create follow-up emails
- Manage calendar conflicts
- Send event updates

**Data Access**:
- `meetings`, `events`
- `availability_schedules`
- `contacts`

#### 3. **Castor** - Podcast Production Manager
**Route**: `/podcasts`, `/episodes`

**Capabilities**:
- Write episode descriptions
- Draft social media posts
- Suggest clip moments
- Generate show notes
- Create episode announcements

**Data Access**:
- `podcasts`, `episodes`
- `podcast_stats`
- `distribution_status`

#### 4. **Echo** - Studio Director
**Route**: `/studio`, `/recording`

**Capabilities**:
- Guide recording setup
- Coordinate guests
- Pre-production checklists
- Post-production workflows
- Episode notification drafts

**Data Access**:
- `studio_sessions`
- `media_files`

#### 5. **Lex** - Identity & Rights Guardian
**Route**: `/identity`, `/certificates`, `/my-voice-identity`

**Capabilities**:
- Explain verification process
- Interpret certificates
- Guide rights management
- Answer compliance questions
- Licensing assistance

**Data Access**:
- `identity_assets`
- `voice_blockchain_certificates`
- `identity_requests`

#### 6. **Atlas** - Data & Analytics Guide
**Route**: `/analytics`, `/email-home`, `/stats`

**Capabilities**:
- Summarize engagement metrics
- Analyze email performance
- Compute smart send times
- Explain segment insights
- Trend analysis

**Data Access**:
- `email_events`, `email_campaigns`
- `podcast_stats`
- `ad_impressions`

#### 7. **Reel** - Clips & Media Assistant
**Route**: `/clips`, `/media`, `/library`

**Capabilities**:
- Generate clip names
- Write clip descriptions
- Draft social scripts
- Suggest thumbnail text
- Platform optimization tips

**Data Access**:
- `clips`, `media_files`
- `ai_edited_assets`

## Integration Points

### UI Components

#### Campaign Builder
**File**: `src/components/email/CampaignBuilder.tsx`

**Scribe Integration**:
- **"Draft with Scribe"** - Opens Scribe assistant to generate email from scratch
- **"Rewrite"** - Improves existing email content
- **"Improve Subject"** - Generates subject line alternatives
- **"Check Deliverability"** - Analyzes for spam triggers

#### ScribeAssistant Component
**File**: `src/components/email/ScribeAssistant.tsx`

**Features**:
- Side panel sheet interface
- Tone selection (Professional, Friendly, Casual, Formal, Creator Style)
- Real-time generation
- Copy to clipboard
- Apply directly to email

#### PersonaButtons Component
**File**: `src/components/email/PersonaButtons.tsx`

**Features**:
- Context-aware persona suggestions
- "Ask [Persona]" buttons
- Automatic persona routing

#### SeeksyAIChatWidget
**File**: `src/components/SeeksyAIChatWidget.tsx`

**Features**:
- Global keyboard shortcut: `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Win)
- Routes all messages through Global Agent
- Context-aware responses
- Conversation history

### Edge Functions

#### `global-agent`
- **Auth**: Required (`verify_jwt = true`)
- **Method**: POST
- **Body**: `{ message: string, context: { route, role } }`
- **Response**: `{ success: true, persona: string, response: string }`

#### `scribe-agent`
- **Auth**: Required (`verify_jwt = true`)
- **Method**: POST
- **Body**: `{ action, input, tone, contactId, context }`
- **Response**: `{ success: true, result: { subject, preheader, body } }`

## Usage Examples

### Draft Email with Scribe

```typescript
const { data } = await supabase.functions.invoke("scribe-agent", {
  body: {
    action: "draft",
    input: "Welcome new subscribers to our podcast",
    tone: "friendly",
    context: { emailBody: "", subject: "" },
  },
});

// Returns:
// {
//   subject: "Welcome to [Podcast Name]!",
//   preheader: "We're excited to have you here",
//   body: "<p>Hi {{contact.first_name}},</p>..."
// }
```

### Check Deliverability

```typescript
const { data } = await supabase.functions.invoke("scribe-agent", {
  body: {
    action: "check_deliverability",
    input: emailContent,
    context: { subject: "FREE OFFER!!!" },
  },
});

// Returns:
// {
//   score: 45,
//   issues: ["All caps in subject", "Spam trigger: 'FREE'"],
//   suggestions: ["Use title case", "Replace 'FREE' with 'Complimentary'"]
// }
```

### Ask Global Agent

```typescript
const { data } = await supabase.functions.invoke("global-agent", {
  body: {
    message: "How do I verify my voice identity?",
    context: {
      route: "/identity",
      role: "creator",
    },
  },
});

// Routes to Lex persona automatically
// Returns step-by-step verification guidance
```

## Configuration

### Email Personas Registry
**File**: `src/lib/email-personas.ts`

Defines all personas with:
- Name, role, icon
- Color scheme
- Email signature
- Description

### Supabase Config
**File**: `supabase/config.toml`

```toml
[functions.global-agent]
verify_jwt = true

[functions.scribe-agent]
verify_jwt = true
```

## Keyboard Shortcuts

- **`Cmd+Shift+S`** (Mac) / **`Ctrl+Shift+S`** (Win) - Toggle Spark AI chat
- Works globally across all pages

## Best Practices

1. **Context is King**: Always pass route and role context for accurate routing
2. **Tone Selection**: Choose tone based on audience (creator, subscriber, advertiser)
3. **Merge Tags**: Use `{{contact.first_name}}` for personalization
4. **Deliverability**: Always check before sending high-volume campaigns
5. **Persona Routing**: Let the Global Agent route - don't hardcode persona calls

## Future Enhancements

- [ ] Multi-persona conversations (e.g., Scribe + Mia for meeting follow-up emails)
- [ ] Voice interactions for Spark
- [ ] Persona memory across sessions
- [ ] A/B testing suggestions from Atlas
- [ ] Automated campaign workflows combining multiple personas
- [ ] Real-time collaboration with AI during live streams (Echo)

## Troubleshooting

### Persona Not Routing Correctly
- Check route context in request body
- Verify keyword detection logic in `detectPersona()`
- Ensure user is authenticated

### Scribe Generation Failing
- Verify `LOVABLE_API_KEY` is set
- Check input length (max ~2000 chars)
- Ensure contact data exists if using personalization

### Chat Widget Not Opening
- Check keyboard shortcut (Cmd+Shift+S)
- Verify user is not on investor portal page (`/investor`)
- Check browser console for errors

## Credits

All AI requests consume Lovable AI credits:
- **Scribe actions**: 1 credit per generation
- **Global Agent messages**: 1 credit per message
- **Persona routing**: Included in message credit

---

Built with ❤️ by the Seeksy Team using Lovable AI Gateway
