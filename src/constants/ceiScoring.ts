// CEI (Call Experience Index) Scoring Rules and Constants

export const CEI_BASE_SCORE = 100;

// Duration-based penalties (applied server-side)
export const CEI_DURATION_PENALTIES = {
  quick_hangup_under_30s: -40,
  short_call_30_to_90s: -20,
  early_handoff_request_under_60s: -25,
} as const;

export const CEI_PENALTIES: Record<string, number> = {
  dispatch_requested: -25,
  human_requested: -25,
  repeat_human_request: -20,
  impatience_phrase_detected: -15,
  confusion_correction_detected: -10,
  hard_frustration_detected: -15,
  load_lookup_failed: -10,
  lead_create_failed: -20,
  quick_hangup_under_30s: -40,
  short_call_30_to_90s: -20,
  early_handoff_request_under_60s: -25,
};

export const CEI_BONUSES: Record<string, number> = {
  caller_thanked: 5,
  booking_interest_confirmed: 10,
  call_resolved_without_handoff: 10,
  alternate_load_provided: 10,
  ai_verified_phone: 5,
  ai_repeated_info_correctly: 5,
  lead_created: 10,
  load_confirmed: 20,
};

export const CEI_BANDS = [
  { min: 90, max: 100, band: '90-100', label: 'Excellent', color: 'hsl(var(--success))' },
  { min: 75, max: 89, band: '75-89', label: 'Strong', color: 'hsl(142.1 76.2% 46.3%)' },
  { min: 50, max: 74, band: '50-74', label: 'Mixed', color: 'hsl(var(--warning))' },
  { min: 25, max: 49, band: '25-49', label: 'Poor', color: 'hsl(var(--destructive))' },
  { min: 0, max: 24, band: '0-24', label: 'Critical', color: 'hsl(0 84.2% 40.2%)' },
] as const;

export const PHRASE_LISTS = {
  dispatch_or_human_request: [
    'talk to dispatch',
    'dispatch',
    'agent',
    'real person',
    'human',
    'transfer me',
    'operator',
    'dispatcher',
    'let me talk to someone',
  ],
  impatience: [
    'just tell me',
    'get to the point',
    'quick question',
    'skip the details',
    "i don't have time",
  ],
  confusion_correction: [
    "that's not right",
    'wrong',
    'no i said',
    'i already told you',
    'not that',
  ],
  hard_frustration: [
    'this is annoying',
    'this is frustrating',
    'forget it',
    'waste of time',
    'never mind',
  ],
};

export const CALL_OUTCOMES = [
  { value: 'confirmed', label: 'Confirmed', color: 'hsl(var(--success))' },
  { value: 'declined', label: 'Declined', color: 'hsl(var(--muted-foreground))' },
  { value: 'callback_requested', label: 'Callback', color: 'hsl(var(--warning))' },
  { value: 'incomplete', label: 'Incomplete', color: 'hsl(var(--muted-foreground))' },
  { value: 'error', label: 'Error', color: 'hsl(var(--destructive))' },
] as const;

export const EVENT_TYPES = {
  // Load operations
  load_lookup_started: { label: 'Load Lookup Started', severity: 'info', category: 'load' },
  load_lookup_success: { label: 'Load Found', severity: 'info', category: 'load' },
  load_lookup_failed: { label: 'Load Not Found', severity: 'warn', category: 'load' },
  alternate_load_requested: { label: 'Alternate Load Requested', severity: 'info', category: 'load' },
  alternate_load_provided: { label: 'Alternate Load Provided', severity: 'info', category: 'load' },
  
  // Rate operations
  rate_quoted: { label: 'Rate Quoted', severity: 'info', category: 'rate' },
  rate_negotiation_requested: { label: 'Rate Negotiation', severity: 'info', category: 'rate' },
  rate_increment_offered: { label: 'Rate Increment Offered', severity: 'info', category: 'rate' },
  rate_floor_reached: { label: 'Rate Floor Reached', severity: 'warn', category: 'rate' },
  
  // Booking
  booking_interest_confirmed: { label: 'Booking Interest', severity: 'info', category: 'booking' },
  
  // Info collection
  info_requested_mc: { label: 'MC Requested', severity: 'info', category: 'info' },
  info_provided_mc: { label: 'MC Provided', severity: 'info', category: 'info' },
  info_requested_company: { label: 'Company Requested', severity: 'info', category: 'info' },
  info_provided_company: { label: 'Company Provided', severity: 'info', category: 'info' },
  info_requested_phone: { label: 'Phone Requested', severity: 'info', category: 'info' },
  info_provided_phone: { label: 'Phone Provided', severity: 'info', category: 'info' },
  repeat_back_verification_done: { label: 'Verification Done', severity: 'info', category: 'info' },
  
  // Handoff signals
  dispatch_requested: { label: 'Dispatch Requested', severity: 'error', category: 'handoff' },
  human_requested: { label: 'Human Requested', severity: 'error', category: 'handoff' },
  
  // Frustration signals
  impatience_phrase_detected: { label: 'Impatience Detected', severity: 'warn', category: 'frustration' },
  confusion_correction_detected: { label: 'Confusion Detected', severity: 'warn', category: 'frustration' },
  hard_frustration_detected: { label: 'Hard Frustration', severity: 'error', category: 'frustration' },
  
  // Success signals
  caller_thanked: { label: 'Caller Thanked', severity: 'info', category: 'success' },
  call_resolved_without_handoff: { label: 'Resolved (No Handoff)', severity: 'info', category: 'success' },
  
  // Lead operations
  lead_create_attempted: { label: 'Lead Creation Attempted', severity: 'info', category: 'lead' },
  lead_create_success: { label: 'Lead Created', severity: 'info', category: 'lead' },
  lead_create_failed: { label: 'Lead Creation Failed', severity: 'error', category: 'lead' },
  
  // System events
  post_call_webhook_attempted: { label: 'Webhook Attempted', severity: 'info', category: 'system' },
  post_call_webhook_success: { label: 'Webhook Success', severity: 'info', category: 'system' },
  post_call_webhook_failed: { label: 'Webhook Failed', severity: 'error', category: 'system' },
  silence_timeout: { label: 'Silence Timeout', severity: 'warn', category: 'system' },
  agent_pause_detected: { label: 'Agent Pause', severity: 'info', category: 'system' },
} as const;

export function getCEIBand(score: number): string {
  for (const band of CEI_BANDS) {
    if (score >= band.min && score <= band.max) {
      return band.band;
    }
  }
  return '0-24';
}

export function getCEIBandInfo(score: number) {
  for (const band of CEI_BANDS) {
    if (score >= band.min && score <= band.max) {
      return band;
    }
  }
  return CEI_BANDS[CEI_BANDS.length - 1];
}

export function calculateCEIScore(events: Array<{ event_type: string }>): number {
  let score = CEI_BASE_SCORE;
  
  for (const event of events) {
    const penalty = CEI_PENALTIES[event.event_type];
    if (penalty !== undefined) {
      score += penalty;
    }
    
    const bonus = CEI_BONUSES[event.event_type];
    if (bonus !== undefined) {
      score += bonus;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

export function getEventDelta(eventType: string): number {
  return CEI_PENALTIES[eventType] || CEI_BONUSES[eventType] || 0;
}
