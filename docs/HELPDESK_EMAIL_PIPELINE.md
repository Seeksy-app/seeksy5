# Help Desk Email Pipeline Architecture

## Overview
Emails sent to `hello@seeksy.io` will automatically create or update Help Desk tickets and provide context to Support AI for suggested replies.

---

## Flow Diagram

```
Email → Resend Webhook → Edge Function → Database → Support AI
         ↓                    ↓              ↓
    Parse email         Create/update    Suggest reply
                         ticket
```

---

## Required Components

### 1. Email Receiving (Resend Inbound)
- Configure Resend to forward emails from `hello@seeksy.io` to webhook
- Webhook URL: `https://{project}.supabase.co/functions/v1/helpdesk-inbound-email`

### 2. Edge Function: `helpdesk-inbound-email`
```typescript
// Responsibilities:
// 1. Parse incoming email (from, subject, body, attachments)
// 2. Match to existing ticket by thread ID or subject
// 3. Create new ticket if no match
// 4. Add message to ticket thread
// 5. Trigger Support AI for suggested reply
```

### 3. Database Tables

#### `support_tickets` (existing, extend)
- Add `email_thread_id` (text) - for matching replies
- Add `last_email_at` (timestamp)

#### `ticket_messages` (new)
```sql
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('customer', 'agent', 'ai')),
  sender_email TEXT,
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `ai_suggested_replies` (new)
```sql
CREATE TABLE ai_suggested_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  message_id UUID REFERENCES ticket_messages(id),
  suggestion TEXT NOT NULL,
  confidence_score DECIMAL,
  kb_chunks_used JSONB, -- Array of chunk IDs used
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ -- Set when agent uses this suggestion
);
```

### 4. Support AI Integration

#### Retrieval Flow:
1. New email arrives → parse content
2. Query `kb_chunks` for relevant knowledge (semantic search)
3. Query `rd_insights` for trend context
4. Generate suggested reply (1-2 sentences)
5. Store in `ai_suggested_replies` with chunk IDs

#### Response Generation:
```typescript
const suggestedReply = await generateAIReply({
  ticketContent: email.body,
  kbChunks: relevantChunks,
  rdInsights: relatedInsights,
  previousMessages: threadHistory,
  maxLength: '2 sentences',
});
```

---

## UI Integration

### Agent Inbox View
- Show AI suggested reply badge on tickets
- One-click "Use Suggestion" button
- "Regenerate" option if suggestion isn't helpful
- Confidence score indicator

### Ticket Detail Panel
- Thread view with all messages
- AI suggestion card with:
  - Suggested text
  - Confidence %
  - KB sources used (expandable)
  - "Send as Reply" / "Edit & Send" buttons

---

## Webhook Configuration

### Resend Inbound Setup
1. Go to Resend Dashboard → Webhooks
2. Add webhook for `email.received` event
3. Set URL: `https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/helpdesk-inbound-email`
4. Configure MX records for `seeksy.io` to route to Resend

### Payload Structure (from Resend)
```json
{
  "type": "email.received",
  "data": {
    "from": "user@example.com",
    "to": "hello@seeksy.io",
    "subject": "Help with my account",
    "text": "Plain text body",
    "html": "HTML body",
    "attachments": []
  }
}
```

---

## Implementation Priority

1. **Phase 1**: Create `ticket_messages` and `ai_suggested_replies` tables
2. **Phase 2**: Build `helpdesk-inbound-email` edge function
3. **Phase 3**: Integrate AI suggestion generation
4. **Phase 4**: Update Help Desk UI to show suggestions
5. **Phase 5**: Add analytics for suggestion usage

---

## Security Considerations

- Validate webhook signature from Resend
- Sanitize email content before storing
- Rate limit ticket creation per sender
- Don't expose internal KB chunk content to external users
