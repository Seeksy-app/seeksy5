import { Button } from "@/components/ui/button";

// Chat modes for the benefits hub
export type ChatMode = "va_claims" | "calculators" | "general_benefits";

// Tagged quick reply for mode filtering
interface TaggedQuickReply {
  label: string;
  tags: ChatMode[];
}

interface QuickRepliesProps {
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function ClaimsQuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((option) => (
        <Button
          key={option}
          variant="outline"
          size="sm"
          className="rounded-full text-sm px-4 py-2 h-auto hover:bg-primary/10 hover:border-primary transition-colors"
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

// All available quick replies with mode tags
const TAGGED_QUICK_REPLIES: TaggedQuickReply[] = [
  // VA Claims mode
  { label: "Find me an accredited representative", tags: ["va_claims"] },
  { label: "Start an Intent to File", tags: ["va_claims"] },
  { label: "What evidence do I need?", tags: ["va_claims"] },
  { label: "Help me describe my conditions", tags: ["va_claims"] },
  { label: "Check claim status (steps)", tags: ["va_claims"] },
  { label: "Explain Intent to File", tags: ["va_claims"] },
  { label: "Help me understand my conditions", tags: ["va_claims"] },
  { label: "Other question", tags: ["va_claims", "calculators", "general_benefits"] },
  
  // Calculator mode only
  { label: "Estimate my VA compensation", tags: ["calculators"] },
  { label: "Calculate TSP growth", tags: ["calculators"] },
  { label: "Military buy-back calculator", tags: ["calculators"] },
  { label: "FERS pension estimate", tags: ["calculators"] },
];

// Get quick replies filtered by mode
export function getQuickReplies(mode: ChatMode = "va_claims", customReplies?: string[]): string[] {
  // If custom replies provided (from AI), filter them by mode
  if (customReplies && customReplies.length > 0) {
    return filterRepliesByMode(customReplies, mode);
  }
  
  // Return default replies for the mode
  return TAGGED_QUICK_REPLIES
    .filter(r => r.tags.includes(mode))
    .map(r => r.label)
    .slice(0, 6);
}

// Filter AI-generated replies by mode (remove calculator prompts in va_claims mode)
function filterRepliesByMode(replies: string[], mode: ChatMode): string[] {
  if (mode !== "va_claims") return replies;
  
  // Calculator-related patterns to exclude from va_claims mode
  const calculatorPatterns = [
    /tsp/i,
    /estimate.*growth/i,
    /calculate.*pension/i,
    /calculate.*compensation/i,
    /calculate.*benefits/i,
    /retirement.*calculator/i,
    /buy.?back.*calculator/i,
    /fers.*estimate/i,
    /sick.*leave.*credit/i,
  ];
  
  return replies.filter(reply => 
    !calculatorPatterns.some(pattern => pattern.test(reply))
  );
}

// Check if a user message is asking about calculators
export function isCalculatorRequest(message: string): boolean {
  const patterns = [
    /\btsp\b/i,
    /estimate.*growth/i,
    /calculate.*pension/i,
    /calculate.*retirement/i,
    /calculate.*benefits/i,
    /fers.*pension/i,
    /military.*buy.?back/i,
    /sick.*leave.*credit/i,
    /how much.*pension/i,
    /how much.*retirement/i,
  ];
  return patterns.some(p => p.test(message));
}

// VA Claims default quick replies (never includes calculators)
export const VA_CLAIMS_QUICK_REPLIES = [
  "Find me an accredited representative",
  "Start an Intent to File",
  "What evidence do I need?",
  "Help me describe my conditions",
  "Check claim status (steps)",
  "Other question",
];

// Legacy export for backwards compatibility
export const QUICK_REPLY_TEMPLATES = {
  yesNo: ["Yes", "No", "Not sure"],
  navigation: VA_CLAIMS_QUICK_REPLIES,
  symptoms: [
    "Back pain",
    "Hearing loss / Tinnitus",
    "PTSD / Mental health",
    "Joint pain",
    "Other condition"
  ],
  evidence: [
    "I have medical records",
    "I have buddy statements",
    "I need help gathering evidence",
    "What evidence do I need?"
  ],
  nextSteps: [
    "Yes, I can do this now",
    "I'll do this later",
    "I need more help",
    "Other"
  ],
  findRep: [
    "Search for VSO representatives",
    "I want an attorney",
    "I want a claims agent",
    "What's the difference?"
  ]
};
