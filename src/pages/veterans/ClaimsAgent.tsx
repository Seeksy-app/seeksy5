import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Send, Loader2, ExternalLink, AlertCircle, ChevronRight, 
  ClipboardList, Shield, Calculator, Sparkles, FileText,
  Clock, Users
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClaimsRightSidebar, ClaimsNote } from "@/components/veterans/ClaimsRightSidebar";
import { ClaimsChatMessage } from "@/components/veterans/ClaimsChatMessage";
import { VA_CLAIMS_QUICK_REPLIES, getQuickReplies, isCalculatorRequest, ChatMode } from "@/components/veterans/ClaimsQuickReplies";
import { FindRepForm } from "@/components/veterans/FindRepForm";
import { Helmet } from "react-helmet";

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

interface IntakeData {
  status: string;
  branch: string;
  claimStatus: string;
  primaryGoals: string[];
}

interface VeteranProfile {
  service_status: string | null;
  branch_of_service: string | null;
  has_intent_to_file: boolean | null;
  last_claim_stage: string | null;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hi — I can help you prepare an **Intent to File** and organize your claim. I can't submit to the VA for you, but I'll get everything ready and walk you through the upload.\n\nWhat would you like to do?",
  quickReplies: [
    "File an Intent to File (protect my date)",
    "Get help choosing what to file",
    "Connect with an accredited representative"
  ]
};

const SUGGESTION_PROMPTS = [
  { title: "Intent to File", description: "Protect your effective date", icon: Clock, action: "File an Intent to File" },
  { title: "Find a Rep", description: "Connect with accredited help", icon: Users, action: "Find me an accredited representative" },
  { title: "Evidence Help", description: "What you need to prove your claim", icon: ClipboardList, action: "What evidence do I need for my claim?" },
  { title: "Help Me Choose", description: "Guide me through options", icon: FileText, action: "Help me decide what to file" },
];

// Intent patterns that should trigger handoff to the structured form
// Only trigger on EXPLICIT requests to FILE, not just discuss
const INTENT_TO_FILE_PATTERNS = [
  /^file\s+(an?\s+)?intent\s*to\s*file/i,
  /^start\s+(my\s+)?intent\s*to\s*file/i,
  /^begin\s+(my\s+)?intent\s*to\s*file/i,
  /take\s+me\s+to\s+(the\s+)?intent\s*to\s*file\s+form/i,
  /^i\s+want\s+to\s+file\s+(an?\s+)?intent/i,
];

const createSystemPrompt = (notes: ClaimsNote[], userName?: string, profile?: VeteranProfile | null) => {
  const notesContext = notes.length > 0 
    ? `\n\nCollected information:\n${notes.map(n => `- ${n.category}: ${n.value}`).join('\n')}`
    : '';
  
  const profileContext = profile ? `
Profile:
- Status: ${profile.service_status || 'Unknown'}
- Branch: ${profile.branch_of_service || 'Unknown'}
- Intent to File: ${profile.has_intent_to_file ? 'Yes' : 'No'}` : '';
  
  const nameGreeting = userName ? `The user's name is ${userName}. Use their name occasionally.` : '';
    
  return `You are a VA Claims Agent helping veterans understand and file their disability claims. You speak at an 8th-grade reading level. You are calm, clear, encouraging, and non-technical.

${nameGreeting}
${profileContext}
${notesContext}

CAPABILITIES:
1. Help veterans understand VA disability benefits
2. Guide them through the Intent to File process
3. Collect information about service-connected conditions
4. Explain claims process in simple terms

OUT OF SCOPE - DO NOT HELP WITH:
- TSP growth, retirement estimates, pension calculations
- Any financial projections or investment advice
If asked, say: "I focus on VA claims preparation. Use the Calculators button above for financial tools."

FORMATTING RULES:
1. Use <strong>text</strong> for emphasis, NEVER markdown **text**
2. Keep responses SHORT: 2-4 sentences per paragraph max
3. Add blank lines between paragraphs
4. After asking a question, add "For example:" with 1-3 short sample answers
5. Be encouraging and supportive

CRITICAL: At the END of EVERY response, include suggested prompts:
<prompts>["First suggestion", "Second suggestion", "Third suggestion"]</prompts>

IMPORTANT: After user responses about their conditions/situation, include:
<notes>
{"category": "Category Name", "value": "Brief bullet phrase"}
</notes>

Categories: Years of Service, Separation Year, Claimed Conditions, Current Symptoms, Available Evidence, Existing VA Rating, Medical History, Service Connection, Important Dates`;
};

export default function ClaimsAgent() {
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');
  const isNewParam = searchParams.get('new') === 'true';
  const initialQuestion = searchParams.get('q');
  const actionParam = searchParams.get('action');
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<VeteranProfile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<ClaimsNote[]>([]);
  const [userName, setUserName] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showCalculators, setShowCalculators] = useState(false);
  const [showFindRepModal, setShowFindRepModal] = useState(false);
  const [chatMode] = useState<ChatMode>("va_claims"); // This hub is always va_claims mode
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check auth state and load profile
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from('veteran_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        if (data) setProfile(data);

        // Get user's name from metadata
        const fullName = session.user.user_metadata?.full_name;
        if (fullName) {
          setUserName(fullName.split(' ')[0]);
        }
      }
    };
    
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load conversation or show welcome
  useEffect(() => {
    const loadConversation = async () => {
      setIsLoadingConversation(true);

      // New conversation requested - show welcome
      if (isNewParam || !conversationIdParam) {
        setMessages([WELCOME_MESSAGE]);
        setNotes([]);
        setConversationId(null);
        setIsLoadingConversation(false);
        return;
      }

      // Load specific conversation
      if (conversationIdParam && user) {
        try {
          const { data: convo } = await supabase
            .from('veteran_conversations')
            .select('*')
            .eq('id', conversationIdParam)
            .single();

          if (convo) {
            setConversationId(conversationIdParam);

            // Load context
            if (convo.context_json && typeof convo.context_json === 'object') {
              const context = convo.context_json as Record<string, unknown>;
              if (context.userName) setUserName(context.userName as string);
              if (context.notes && Array.isArray(context.notes)) {
                setNotes(context.notes as ClaimsNote[]);
              }
            }

            // Load messages
            const { data: chatMessages } = await supabase
              .from('veteran_chat_messages')
              .select('*')
              .eq('conversation_id', conversationIdParam)
              .order('created_at', { ascending: true });

            if (chatMessages && chatMessages.length > 0) {
              const loadedMessages: Message[] = chatMessages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                quickReplies: Array.isArray(m.quick_replies) ? m.quick_replies as string[] : undefined,
              }));
              setMessages(loadedMessages);

              // Extract notes from messages
              const allNotes: ClaimsNote[] = [];
              chatMessages.forEach(m => {
                if (m.notes && Array.isArray(m.notes)) {
                  (m.notes as unknown as ClaimsNote[]).forEach(n => {
                    if (n && typeof n === 'object' && 'category' in n && 'value' in n) {
                      if (!allNotes.some(existing => existing.category === n.category && existing.value === n.value)) {
                        allNotes.push({ category: String(n.category), value: String(n.value) });
                      }
                    }
                  });
                }
              });
              if (allNotes.length > 0) setNotes(allNotes);
            } else {
              // No messages yet - show welcome
              setMessages([WELCOME_MESSAGE]);
            }
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          setMessages([WELCOME_MESSAGE]);
        }
      } else {
        setMessages([WELCOME_MESSAGE]);
      }

      setIsLoadingConversation(false);
    };

    loadConversation();
  }, [conversationIdParam, isNewParam, user]);

  // Handle initial question or action from URL params
  const [hasProcessedUrlParams, setHasProcessedUrlParams] = useState(false);
  useEffect(() => {
    if (!isLoadingConversation && !hasProcessedUrlParams && messages.length > 0) {
      if (initialQuestion) {
        // Auto-send the question from URL
        setHasProcessedUrlParams(true);
        setTimeout(() => {
          setInput(initialQuestion);
          // Trigger send after setting input
          const event = new CustomEvent('auto-send-message', { detail: initialQuestion });
          window.dispatchEvent(event);
        }, 500);
      } else if (actionParam === 'start-claim') {
        // Auto-trigger "File an Intent to File" flow
        setHasProcessedUrlParams(true);
        setTimeout(() => {
          const event = new CustomEvent('auto-send-message', { detail: 'File an Intent to File (protect my date)' });
          window.dispatchEvent(event);
        }, 500);
      } else {
        setHasProcessedUrlParams(true);
      }
    }
  }, [isLoadingConversation, hasProcessedUrlParams, initialQuestion, actionParam, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const extractNotes = (content: string): { cleanContent: string; note: ClaimsNote | null } => {
    const notesMatch = content.match(/<notes>\s*({.*?})\s*<\/notes>/s);
    if (notesMatch) {
      try {
        const noteData = JSON.parse(notesMatch[1]);
        const cleanContent = content.replace(/<notes>[\s\S]*?<\/notes>/g, '').trim();
        return { cleanContent, note: { category: noteData.category, value: noteData.value } };
      } catch {
        return { cleanContent: content, note: null };
      }
    }
    return { cleanContent: content, note: null };
  };

  const extractPrompts = (content: string): { cleanContent: string; prompts: string[] } => {
    const promptsMatch = content.match(/<prompts>\s*(\[.*?\])\s*<\/prompts>/s);
    if (promptsMatch) {
      try {
        const prompts = JSON.parse(promptsMatch[1]);
        const cleanContent = content.replace(/<prompts>[\s\S]*?<\/prompts>/g, '').trim();
        return { cleanContent, prompts: Array.isArray(prompts) ? prompts : [] };
      } catch {
        return { cleanContent: content, prompts: [] };
      }
    }
    return { cleanContent: content, prompts: [] };
  };

  // Generate a descriptive title from the first user message
  const generateSessionTitle = (firstMessage: string): string => {
    const lower = firstMessage.toLowerCase();
    if (/intent\s*to\s*file/i.test(lower)) return "Intent to File Preparation";
    if (/find.*(rep|representative|vso|attorney)/i.test(lower)) return "Find a Representative";
    if (/evidence/i.test(lower)) return "Evidence & Documentation Help";
    if (/compensation|rating|percentage/i.test(lower)) return "Compensation Questions";
    if (/claim\s*status/i.test(lower)) return "Claim Status Help";
    if (/appeal/i.test(lower)) return "Appeals Guidance";
    if (/condition|disability|pain|injury/i.test(lower)) return "Condition Discussion";
    // Truncate to first 40 chars as fallback
    const truncated = firstMessage.slice(0, 40).trim();
    return truncated.length < firstMessage.length ? `${truncated}...` : truncated;
  };

  const createOrGetConversation = async (firstMessage?: string): Promise<string | null> => {
    if (!user) return null;
    if (conversationId) return conversationId;

    try {
      const title = firstMessage ? generateSessionTitle(firstMessage) : 'New Conversation';
      const { data, error } = await supabase
        .from('veteran_conversations')
        .insert({
          user_id: user.id,
          title,
          context_json: { userName, notes: [] },
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (message: Message, convoId: string, currentNotes?: ClaimsNote[]) => {
    if (!user) return;

    try {
      await supabase.from('veteran_chat_messages').insert({
        conversation_id: convoId,
        role: message.role,
        content: message.content,
        quick_replies: message.quickReplies || null,
        notes: currentNotes ? currentNotes.map(n => ({ category: n.category, value: n.value })) : null,
      });

      const contextData = { userName: userName || null, notes: (currentNotes || notes).map(n => ({ category: n.category, value: n.value })) };

      // Only update context and timestamp, don't overwrite title
      await supabase
        .from('veteran_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          context_json: contextData,
        })
        .eq('id', convoId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    // Handle "Open Calculators" quick action
    if (userMessage.toLowerCase() === "open calculators") {
      setShowCalculators(true);
      return;
    }

    // Check if user wants to find a rep - open the Find Rep modal
    const isFindRepRequest = /find.*(rep|representative|vso|attorney|agent)/i.test(userMessage) ||
      /accredited.*(rep|representative|help)/i.test(userMessage) ||
      userMessage.toLowerCase().includes("find me an accredited");
    
    if (isFindRepRequest) {
      setInput("");
      const userMsg: Message = { role: "user", content: userMessage };
      setMessages(prev => [...prev, userMsg]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "I'll help you find an accredited representative. Please fill out the form below with your ZIP code and preferences.",
          quickReplies: []
        }]);
        setShowFindRepModal(true);
      }, 300);
      return;
    }

    // Check if user is asking about calculators - graceful redirect
    if (isCalculatorRequest(userMessage)) {
      setInput("");
      const userMsg: Message = { role: "user", content: userMessage };
      setMessages(prev => [...prev, userMsg]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "I focus on VA claims preparation. For financial calculations like TSP growth, pension estimates, or compensation calculations, use our dedicated calculators.",
          quickReplies: ["Open Calculators", "Start an Intent to File", "Find me an accredited representative", "What evidence do I need?"]
        }]);
      }, 300);
      return;
    }

    // Check if user wants to file Intent to File - hand off to structured form
    const isIntentToFileRequest = INTENT_TO_FILE_PATTERNS.some(pattern => pattern.test(userMessage));
    if (isIntentToFileRequest) {
      setInput("");
      const handoffMessage: Message = { role: "user", content: userMessage };
      setMessages(prev => [...prev, handoffMessage]);
      
      // Brief assistant response before redirect
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Great choice! I'll take you to our **Intent to File form** where we'll collect your information step by step.\n\nYou'll be able to:\n• Enter your veteran info\n• Select your claim type and conditions\n• Choose a representative (optional)\n• Download your completed forms",
          quickReplies: []
        }]);
        
        // Navigate after a brief delay to show the message
        setTimeout(() => {
          navigate('/yourbenefits/intent-to-file');
        }, 2000);
      }, 500);
      return;
    }

    setInput("");
    setError(null);
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Create conversation if needed (pass first message for title generation)
    let activeConvoId = conversationId;
    if (user && !activeConvoId) {
      activeConvoId = await createOrGetConversation(userMessage);
    }

    // Save user message
    if (activeConvoId) {
      await saveMessage(newUserMessage, activeConvoId);
    }

    try {
      const response = await supabase.functions.invoke("veteran-claims-chat", {
        body: {
          messages: messages.filter(m => m.role !== 'assistant' || !m.quickReplies?.length || messages.indexOf(m) !== 0)
            .concat([newUserMessage])
            .map(m => ({ role: m.role, content: m.content })),
          systemPrompt: createSystemPrompt(notes, userName, profile)
        }
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.error) {
        if (response.data.error.includes("Rate limit")) {
          setError("We're experiencing high demand. Please wait a moment and try again.");
        } else if (response.data.error.includes("credits")) {
          setError("Service temporarily unavailable. Please try again later.");
        } else {
          setError(response.data.error);
        }
        return;
      }

      let rawMessage = response.data?.message || "I'm sorry, I couldn't process that. Could you try again?";
      
      const { cleanContent: contentAfterNotes, note } = extractNotes(rawMessage);
      const { cleanContent: contentAfterPrompts, prompts } = extractPrompts(contentAfterNotes);
      
      let updatedNotes = notes;
      if (note) {
        const exists = notes.some(n => n.category === note.category && n.value === note.value);
        if (!exists) {
          updatedNotes = [...notes, note];
          setNotes(updatedNotes);
        }
      }
      
      // Filter quick replies by mode (va_claims - never show calculator prompts)
      const filteredPrompts = getQuickReplies("va_claims", prompts.length > 0 ? prompts : undefined);
      const quickReplies = filteredPrompts.length > 0 ? filteredPrompts : VA_CLAIMS_QUICK_REPLIES;
      const assistantMessage: Message = { role: "assistant", content: contentAfterPrompts, quickReplies };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message
      if (activeConvoId) {
        await saveMessage(assistantMessage, activeConvoId, updatedNotes);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError("Connection issue. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmitLead = async () => {
    if (!leadForm.name || !leadForm.email) {
      toast.error("Please provide your name and email");
      return;
    }

    setIsSubmittingLead(true);

    try {
      const allNotes = notes.map(n => `${n.category}: ${n.value}`).join("\n");

      const { error } = await supabase
        .from("veteran_leads")
        .insert({
          full_name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone || null,
          source: "claims-agent",
          intent_type: "new_claim",
          status: "prepared"
        });

      if (error) throw error;

      toast.success("Thank you! A claims specialist will contact you within 24 hours.");
      setShowHandoffModal(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Great! I've connected you with our partner claims filing company. They'll reach out within 24 hours to help you file your claim. In the meantime, feel free to ask me any other questions.",
        quickReplies: ["What happens next?", "Tell me about evidence", "Calculate my compensation"]
      }]);
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Listen for auto-send events from URL params
  useEffect(() => {
    const handleAutoSend = (event: CustomEvent) => {
      sendMessage(event.detail);
    };
    window.addEventListener('auto-send-message', handleAutoSend as EventListener);
    return () => {
      window.removeEventListener('auto-send-message', handleAutoSend as EventListener);
    };
  }, [messages, notes, userName, profile, conversationId]);

  const isEmptyChat = messages.length <= 1 && messages[0]?.role === 'assistant';

  if (isLoadingConversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Guest mode banner for unauthenticated users
  const showGuestBanner = !user;

  return (
    <div className="h-full flex flex-col bg-background">
      <Helmet>
        <title>AI Benefits Agent | Veterans Benefits Hub</title>
      </Helmet>

      {/* Guest Banner for unauthenticated users */}
      {showGuestBanner && (
        <div className="bg-primary/10 border-b px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <p className="text-sm text-foreground">
              <span className="font-medium">Guest Mode:</span> Sign up to save your chat history
            </p>
            <Button asChild size="sm" variant="default">
              <Link to="/yourbenefits/auth">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Subheader with actions */}
      <div className="border-b bg-card flex-shrink-0 px-4 py-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link 
            to={user ? "/yourbenefits/dashboard" : "/yourbenefits"} 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {user ? "Dashboard" : "Back"}
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCalculators(true)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculators
          </Button>
        </div>
      </div>

      {/* Calculators Modal - Organized by Category */}
      <Dialog open={showCalculators} onOpenChange={setShowCalculators}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Benefit Calculators
            </DialogTitle>
            <DialogDescription>
              Estimate your military and federal benefits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* VA Disability */}
            <div>
              <h3 className="text-sm font-semibold text-red-500 mb-2">VA Disability</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/calculators/va-combined-rating" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">VA Combined Rating</p>
                      <p className="text-xs text-muted-foreground">Calculate combined disability rating</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/va-compensation" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">VA Compensation</p>
                      <p className="text-xs text-muted-foreground">Estimate monthly compensation</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/tools/crsc" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">CRSC Screener</p>
                      <p className="text-xs text-muted-foreground">Combat-Related Special Compensation eligibility</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Retirement */}
            <div>
              <h3 className="text-sm font-semibold text-blue-500 mb-2">Retirement</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/calculators/military-buyback" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Military Buy-Back</p>
                      <p className="text-xs text-muted-foreground">Calculate service credit deposit</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/mra" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">MRA Calculator</p>
                      <p className="text-xs text-muted-foreground">Find your minimum retirement age</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/sick-leave" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Sick Leave Credit</p>
                      <p className="text-xs text-muted-foreground">Convert leave to service time</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/fers-pension" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">FERS Pension</p>
                      <p className="text-xs text-muted-foreground">Estimate your FERS pension</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/tsp-growth" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">TSP Growth</p>
                      <p className="text-xs text-muted-foreground">Project retirement savings</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/cola" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">COLA Estimator</p>
                      <p className="text-xs text-muted-foreground">Project cost-of-living adjustments</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/brs-comparison" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">BRS vs Legacy</p>
                      <p className="text-xs text-muted-foreground">Compare retirement systems</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Transition */}
            <div>
              <h3 className="text-sm font-semibold text-amber-500 mb-2">Transition</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/tools/separation-readiness" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Separation Readiness</p>
                      <p className="text-xs text-muted-foreground">Check your readiness score</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/leave-sellback" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Leave Sell-Back</p>
                      <p className="text-xs text-muted-foreground">Estimate unused leave value</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Healthcare */}
            <div>
              <h3 className="text-sm font-semibold text-cyan-500 mb-2">Healthcare</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/tools/champva-eligibility" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">CHAMPVA Eligibility</p>
                      <p className="text-xs text-muted-foreground">Check CHAMPVA eligibility</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/tools/tricare-finder" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">TRICARE Finder</p>
                      <p className="text-xs text-muted-foreground">Find your TRICARE options</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/tools/va-means-test" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">VA Means Test</p>
                      <p className="text-xs text-muted-foreground">Estimate priority group</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/va-travel" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">VA Travel Reimbursement</p>
                      <p className="text-xs text-muted-foreground">Estimate travel benefits</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Education */}
            <div>
              <h3 className="text-sm font-semibold text-purple-500 mb-2">Education</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/calculators/gi-bill" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">GI Bill Estimator</p>
                      <p className="text-xs text-muted-foreground">Estimate education benefits</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Protection */}
            <div>
              <h3 className="text-sm font-semibold text-pink-500 mb-2">Protection</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/calculators/sbp" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Survivor Benefit Plan</p>
                      <p className="text-xs text-muted-foreground">Calculate SBP costs and benefits</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/insurance-needs" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Life Insurance Needs</p>
                      <p className="text-xs text-muted-foreground">Estimate coverage needs</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Taxes */}
            <div>
              <h3 className="text-sm font-semibold text-green-500 mb-2">Taxes</h3>
              <div className="grid gap-2">
                <Link to="/yourbenefits/calculators/state-tax-benefits" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">State Tax Benefits</p>
                      <p className="text-xs text-muted-foreground">Estimate state tax savings</p>
                    </div>
                  </Button>
                </Link>
                <Link to="/yourbenefits/calculators/property-tax-exemption" onClick={() => setShowCalculators(false)}>
                  <Button variant="outline" className="w-full justify-start h-auto py-2 px-3">
                    <div className="text-left">
                      <p className="font-medium text-sm">Property Tax Exemption</p>
                      <p className="text-xs text-muted-foreground">Check property tax benefits</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Find a Rep Modal */}
      <Dialog open={showFindRepModal} onOpenChange={setShowFindRepModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Find an Accredited Representative
            </DialogTitle>
            <DialogDescription>
              Search for VSO representatives, attorneys, or claims agents in your area
            </DialogDescription>
          </DialogHeader>
          <FindRepForm 
            onClose={() => {
              setShowFindRepModal(false);
              setMessages(prev => [...prev, {
                role: "assistant",
                content: "Great! Your contact request has been submitted. Is there anything else I can help you with?",
                quickReplies: VA_CLAIMS_QUICK_REPLIES.filter(r => !r.includes("representative"))
              }]);
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="max-w-2xl mx-auto px-3 py-4">
              {/* Welcome Header for empty chat */}
              {isEmptyChat && (
                <div className="text-center mb-6 pt-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 mb-3">
                    <MessageSquare className="w-6 h-6 text-orange-500" />
                  </div>
                  <h1 className="text-xl font-bold mb-1">
                    {userName ? `Hi ${userName}! How can I help?` : 'How can I help you today?'}
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    I'm your VA benefits guide. Ask me about claims, compensation, or use a calculator.
                  </p>
                </div>
              )}

              {/* Suggestion Cards for empty chat */}
              {isEmptyChat && (
                <div className="grid grid-cols-2 gap-2 mb-6 max-w-md mx-auto">
                  {SUGGESTION_PROMPTS.map((prompt) => (
                    <Card 
                      key={prompt.title}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                      onClick={() => handleSuggestionClick(prompt.action)}
                    >
                      <CardContent className="p-3 flex items-start gap-2">
                        <div className="p-1.5 rounded-md bg-muted">
                          <prompt.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight">{prompt.title}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{prompt.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="space-y-4">
              {messages.map((message, index) => {
                // Hide initial welcome message when showing suggestion cards
                if (isEmptyChat && index === 0) return null;
                return (
                  <ClaimsChatMessage
                    key={index}
                    role={message.role}
                    content={message.content}
                    quickReplies={message.quickReplies}
                    onQuickReply={(value) => sendMessage(value)}
                    isLatest={index === messages.length - 1}
                    isLoading={isLoading}
                  />
                );
              })}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                    </div>
                    <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
                      <p className="text-muted-foreground text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-background p-3">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your benefits, claims, or calculations..."
                  disabled={isLoading}
                  className="pr-12 py-6 text-[15px] rounded-xl shadow-sm border-muted-foreground/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Press Enter to send • Your conversation is saved automatically
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden xl:block w-72 border-l bg-card/50 overflow-hidden">
          <ClaimsRightSidebar 
            notes={notes} 
            userName={userName}
            profile={profile}
          />
        </div>
      </div>

      {/* Mobile Notes Button */}
      <div className="xl:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="fixed bottom-24 right-4 z-50 shadow-lg rounded-full"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Notes ({notes.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] p-0">
            <ClaimsRightSidebar 
              notes={notes} 
              userName={userName}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Handoff Modal */}
      <Dialog open={showHandoffModal} onOpenChange={setShowHandoffModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Connect with a Claims Specialist
            </DialogTitle>
            <DialogDescription>
              Ready to file? Our partner will reach out within 24 hours to help you with your claim.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="lead-name">Name *</Label>
              <Input
                id="lead-name"
                value={leadForm.name}
                onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Email *</Label>
              <Input
                id="lead-email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Phone (optional)</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoffModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitLead}
              disabled={isSubmittingLead || !leadForm.name || !leadForm.email}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmittingLead ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Me
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
