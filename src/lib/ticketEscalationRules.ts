// Ticket Auto-Escalation Rules Engine
// Non-LLM deterministic rules for automatic ticket classification and escalation

export interface TicketData {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  // User context
  user_plan?: string;
  user_spend?: number;
  user_tenure_days?: number;
  recent_ticket_count?: number;
}

export interface EscalationResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  escalation_level: 'none' | 'support_lead' | 'engineering' | 'finance' | 'leadership';
  risk_tags: string[];
  escalation_reason?: string;
  rules_triggered: string[];
}

// Keywords that indicate churn risk
const CHURN_KEYWORDS = ['cancel', 'refund', 'chargeback', 'unsubscribe', 'delete account', 'leaving', 'switching', 'competitor'];

// Keywords that indicate billing issues
const BILLING_KEYWORDS = ['charge', 'invoice', 'payment failed', 'overcharged', 'billing', 'credit card', 'subscription'];

// Keywords that indicate critical issues
const CRITICAL_KEYWORDS = ['outage', 'down', 'not working', 'security', 'breach', 'abuse', 'fraud', 'urgent'];

// VIP plan tiers
const VIP_PLANS = ['pro', 'business', 'enterprise'];

export function evaluateEscalationRules(ticket: TicketData): EscalationResult {
  const result: EscalationResult = {
    severity: 'low',
    escalation_level: 'none',
    risk_tags: [],
    rules_triggered: [],
  };

  const textToAnalyze = `${ticket.subject} ${ticket.description}`.toLowerCase();
  const isVIP = ticket.user_plan ? VIP_PLANS.includes(ticket.user_plan.toLowerCase()) : false;
  const highSpender = (ticket.user_spend || 0) > 500;

  // Rule 1: Churn risk keywords
  const hasChurnKeywords = CHURN_KEYWORDS.some(kw => textToAnalyze.includes(kw));
  if (hasChurnKeywords) {
    result.risk_tags.push('churn_risk');
    result.rules_triggered.push('churn_keywords_detected');
    if (result.severity === 'low') result.severity = 'medium';
  }

  // Rule 2: Billing category with negative sentiment indicators
  const hasBillingKeywords = BILLING_KEYWORDS.some(kw => textToAnalyze.includes(kw));
  const hasNegativeIndicators = ['angry', 'frustrated', 'upset', 'terrible', 'awful', 'worst'].some(w => textToAnalyze.includes(w));
  
  if ((ticket.category === 'billing' || hasBillingKeywords) && hasNegativeIndicators) {
    result.escalation_level = 'finance';
    result.risk_tags.push('billing_blocker');
    result.rules_triggered.push('billing_negative_sentiment');
    result.severity = 'high';
  }

  // Rule 3: VIP user with negative indicators
  if ((isVIP || highSpender) && hasNegativeIndicators) {
    if (result.escalation_level === 'none') {
      result.escalation_level = 'support_lead';
    }
    result.severity = 'high';
    result.risk_tags.push('vip_at_risk');
    result.rules_triggered.push('vip_negative_sentiment');
  }

  // Rule 4: Repeat bug reporter (3+ tickets in 14 days)
  if (ticket.category === 'bug' && (ticket.recent_ticket_count || 0) >= 3) {
    result.escalation_level = 'engineering';
    result.risk_tags.push('repeat_bug');
    result.rules_triggered.push('repeat_bug_reporter');
    if (result.severity !== 'critical') result.severity = 'high';
  }

  // Rule 5: Critical category or keywords
  const hasCriticalKeywords = CRITICAL_KEYWORDS.some(kw => textToAnalyze.includes(kw));
  if (['outage', 'security', 'abuse'].includes(ticket.category) || hasCriticalKeywords) {
    result.escalation_level = 'leadership';
    result.severity = 'critical';
    result.risk_tags.push('critical_issue');
    result.rules_triggered.push('critical_category_or_keywords');
  }

  // Rule 6: High priority from user
  if (ticket.priority === 'urgent' || ticket.priority === 'high') {
    if (result.severity === 'low') result.severity = 'medium';
    result.rules_triggered.push('user_marked_high_priority');
  }

  // Build escalation reason
  if (result.rules_triggered.length > 0) {
    result.escalation_reason = `Auto-escalated: ${result.rules_triggered.join(', ')}`;
  }

  return result;
}

// Stub for AI-assisted classification (to be wired to LLM later)
export async function aiClassifyTicket(ticket: TicketData): Promise<{
  suggested_category: string;
  suggested_severity: string;
  suggested_sentiment: string;
  suggested_risk_tags: string[];
  confidence: number;
}> {
  // This is a stub - in production, this would call an LLM endpoint
  console.log('[AI Classification Stub] Would analyze ticket:', ticket.id);
  
  // Return sensible defaults based on simple heuristics
  const textToAnalyze = `${ticket.subject} ${ticket.description}`.toLowerCase();
  
  let sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative' = 'neutral';
  if (['great', 'thanks', 'awesome', 'love'].some(w => textToAnalyze.includes(w))) {
    sentiment = 'positive';
  } else if (['frustrated', 'angry', 'terrible', 'awful'].some(w => textToAnalyze.includes(w))) {
    sentiment = 'very_negative';
  } else if (['issue', 'problem', 'bug', 'not working'].some(w => textToAnalyze.includes(w))) {
    sentiment = 'negative';
  }

  return {
    suggested_category: ticket.category || 'general',
    suggested_severity: 'medium',
    suggested_sentiment: sentiment,
    suggested_risk_tags: [],
    confidence: 0.65, // Low confidence since this is a stub
  };
}

// Merge AI suggestions with rule engine results
export function mergeAIWithRules(
  ruleResult: EscalationResult,
  aiResult: Awaited<ReturnType<typeof aiClassifyTicket>>
): EscalationResult {
  // Rules take precedence, but AI can add additional tags
  const merged = { ...ruleResult };
  
  // Add AI-suggested tags that aren't already present
  for (const tag of aiResult.suggested_risk_tags) {
    if (!merged.risk_tags.includes(tag)) {
      merged.risk_tags.push(tag);
    }
  }
  
  // If AI has high confidence and suggests higher severity, consider it
  if (aiResult.confidence > 0.8) {
    const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
    const aiSeverity = aiResult.suggested_severity as keyof typeof severityRank;
    if (severityRank[aiSeverity] > severityRank[merged.severity]) {
      merged.severity = aiSeverity as EscalationResult['severity'];
      merged.rules_triggered.push('ai_severity_upgrade');
    }
  }

  return merged;
}
