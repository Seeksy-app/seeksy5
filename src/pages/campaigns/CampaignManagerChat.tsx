import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Bot,
  CheckCircle2,
  FileText,
  Download,
  Sparkles,
  UserCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CampaignSummary {
  candidateName: string;
  preferredName: string;
  office: string;
  jurisdiction: string;
  electionDate: string;
  status: string;
  topIssues: string[];
  recentGoals: string[];
}

const sidebarItems = [
  { label: "Campaign basics", completed: false },
  { label: "Ballot access & deadlines", completed: false },
  { label: "Messaging & issues", completed: false },
  { label: "Fundraising & outreach", completed: false },
  { label: "Schedule & daily plan", completed: false },
];

const SYSTEM_PROMPT = `You are the AI Campaign Manager for CampaignStaff.ai. You help candidates for local, state, and federal offices plan and run their campaigns.

IMPORTANT GUIDELINES:
- Speak at an 8th grade reading level
- Keep answers clear and encouraging
- Avoid long walls of text
- Use short paragraphs and bullet lists
- Bold key terms using **term**

CONVERSATION FLOW:
1) First, ask the candidate for their name and confirm how you should address them
2) Ask what office they are running for, where, and when the election is
3) Ask about their status (exploring, announced, or active campaign)
4) Ask for their top 3 issues
5) Summarize what you heard

When you ask questions that have clear options (like race level, status, or yes/no), suggest the options clearly.

Suggest concrete next steps such as:
- Writing a stump speech
- Building a timeline
- Planning a first town hall

Be supportive and remind them that every great campaign starts with a single step!`;

export default function CampaignManagerChat() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<CampaignSummary>({
    candidateName: "",
    preferredName: "",
    office: "",
    jurisdiction: "",
    electionDate: "",
    status: "exploring",
    topIssues: [],
    recentGoals: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) navigate("/auth");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadExistingData();
    // Initial greeting
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Welcome to **CampaignStaff.ai**! I'm your AI Campaign Manager, here to help you plan and run a winning campaign.

Let's start by getting to know you. **What's your name**, and how would you like me to address you during our conversations?`
      }]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadExistingData = async () => {
    if (!user) return;
    
    const { data: candidate } = await supabase
      .from("campaign_candidates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (candidate) {
      setSummary({
        candidateName: candidate.display_name || "",
        preferredName: candidate.preferred_name || "",
        office: candidate.office || "",
        jurisdiction: candidate.jurisdiction || "",
        electionDate: candidate.election_date || "",
        status: candidate.campaign_status || "exploring",
        topIssues: candidate.top_issues || [],
        recentGoals: []
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("campaign-chat", {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: SYSTEM_PROMPT,
          candidateId: user?.id
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again."
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update summary if AI extracted info
      if (data.extractedInfo) {
        setSummary(prev => ({ ...prev, ...data.extractedInfo }));
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveSummary = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("campaign_candidates")
        .upsert({
          user_id: user.id,
          display_name: summary.candidateName || "Candidate",
          preferred_name: summary.preferredName,
          office: summary.office,
          jurisdiction: summary.jurisdiction,
          election_date: summary.electionDate || null,
          campaign_status: summary.status,
          top_issues: summary.topIssues
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;
      toast.success("Campaign profile saved!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save. Please try again.");
    }
  };

  return (
    <CampaignLayout>
      <div className="grid lg:grid-cols-[280px_1fr_320px] gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Left Sidebar */}
        <Card className="bg-white border-gray-200 hidden lg:block">
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg">What We&apos;ll Cover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sidebarItems.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                    item.completed ? "bg-green-500/20" : "bg-gray-100"
                  }`}>
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-gray-500 text-sm">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${item.completed ? "text-green-600" : "text-gray-700"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Chat */}
        <Card className="bg-white border-gray-200 flex flex-col">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#d4af37]" />
              AI Campaign Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 bg-gray-50">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-[#d4af37]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-[#d4af37] text-[#0a1628]"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }} />
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-[#d4af37] animate-pulse" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar - Campaign Summary */}
        <Card className="bg-white border-gray-200 hidden lg:block">
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg">Campaign Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-gray-500 text-sm">Candidate Name</span>
              <p className="text-gray-900 font-medium">{summary.candidateName || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Preferred Name</span>
              <p className="text-gray-900">{summary.preferredName || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Office</span>
              <p className="text-gray-900">{summary.office || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Jurisdiction</span>
              <p className="text-gray-900">{summary.jurisdiction || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Election Date</span>
              <p className="text-gray-900">{summary.electionDate || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Status</span>
              <Badge className="bg-[#d4af37]/20 text-[#d4af37] mt-1">
                {summary.status}
              </Badge>
            </div>
            {summary.topIssues.length > 0 && (
              <div>
                <span className="text-gray-500 text-sm">Top Issues</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {summary.topIssues.map((issue, i) => (
                    <Badge key={i} variant="outline" className="border-gray-300 text-gray-700">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <Button 
                onClick={saveSummary}
                className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Save to My Account
              </Button>
              <Button 
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Summary PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}