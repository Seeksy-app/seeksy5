import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Mic2, 
  Mail, 
  Users, 
  Share2,
  Video,
  FileText,
  Sparkles,
  Copy,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  channel: string | null;
  created_at: string;
}

const templates = [
  { id: "speech", label: "Stump Speech", icon: Mic2, description: "A powerful opening speech for rallies and events" },
  { id: "intro", label: "2-Minute Intro", icon: FileText, description: "Quick introduction for debates and forums" },
  { id: "fundraising", label: "Fundraising Email", icon: Mail, description: "Donor outreach and fundraising appeals" },
  { id: "volunteer", label: "Volunteer Recruitment", icon: Users, description: "Recruit volunteers for your campaign" },
  { id: "social_post", label: "Social Media Posts", icon: Share2, description: "Engaging posts for social platforms" },
  { id: "video_script", label: "Video Script", icon: Video, description: "Scripts for video ads and livestreams" },
];

export default function CampaignContentStudio() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    tone: "professional",
    audience: "",
    keyIssue: "",
    length: "medium"
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);

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
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Get or create candidate
    let { data: candidate } = await supabase
      .from("campaign_candidates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!candidate) {
      const { data: newCandidate } = await supabase
        .from("campaign_candidates")
        .insert({ user_id: user.id, display_name: "My Campaign" })
        .select("id")
        .single();
      candidate = newCandidate;
    }

    if (candidate) {
      setCandidateId(candidate.id);
      
      const { data: contentData } = await supabase
        .from("campaign_content_items")
        .select("*")
        .eq("candidate_id", candidate.id)
        .order("created_at", { ascending: false });

      setContent(contentData || []);
    }
    setLoading(false);
  };

  const generateContent = async () => {
    if (!selectedTemplate || !candidateId) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Generate a ${selectedTemplate} for a political campaign with these details:
- Title: ${formData.title}
- Tone: ${formData.tone}
- Target audience: ${formData.audience}
- Key issue to focus on: ${formData.keyIssue}
- Length: ${formData.length}

Please write compelling, engaging content that would resonate with voters.`
          }],
          systemPrompt: "You are an expert political speechwriter and content creator. Write compelling campaign content that is clear, persuasive, and speaks directly to voters. Keep the language at an 8th grade reading level.",
          candidateId: user?.id
        }
      });

      if (error) throw error;
      setGeneratedContent(data.response || "");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveContent = async () => {
    if (!generatedContent || !candidateId || !selectedTemplate) return;

    try {
      const { error } = await supabase
        .from("campaign_content_items")
        .insert({
          candidate_id: candidateId,
          type: selectedTemplate,
          title: formData.title || `${selectedTemplate} - ${new Date().toLocaleDateString()}`,
          body: generatedContent,
          channel: formData.audience
        });

      if (error) throw error;
      
      toast.success("Content saved to library!");
      setSelectedTemplate(null);
      setGeneratedContent("");
      setFormData({ title: "", tone: "professional", audience: "", keyIssue: "", length: "medium" });
      loadData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save content.");
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campaign_content_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Content deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const getTypeLabel = (type: string) => {
    return templates.find(t => t.id === type)?.label || type;
  };

  return (
    <CampaignLayout>
      <div className="space-y-8">
        {/* Templates Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What do you want to create?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className="bg-white border-gray-200 hover:shadow-lg cursor-pointer transition-all group"
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-[#d4af37]/20 flex items-center justify-center mb-4 group-hover:bg-[#d4af37]/30 transition-colors">
                    <template.icon className="h-6 w-6 text-[#d4af37]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.label}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Content Library */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Content Library</h2>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : content.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No content yet. Create your first piece above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {content.map((item) => (
                <Card key={item.id} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <Badge className="bg-[#d4af37]/20 text-[#d4af37]">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.body}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyContent(item.body || "")}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteContent(item.id)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Generation Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="bg-[#1e3a5f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#d4af37]" />
              Create {templates.find(t => t.id === selectedTemplate)?.label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give this content a title..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Tone</label>
                <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="passionate">Passionate</SelectItem>
                    <SelectItem value="folksy">Folksy & Personal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Length</label>
                <Select value={formData.length} onValueChange={(v) => setFormData({ ...formData, length: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1-2 min)</SelectItem>
                    <SelectItem value="medium">Medium (3-5 min)</SelectItem>
                    <SelectItem value="long">Long (5+ min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-1 block">Target Audience</label>
              <Input
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder="e.g., Young voters, seniors, small business owners..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 mb-1 block">Key Issue to Focus On</label>
              <Input
                value={formData.keyIssue}
                onChange={(e) => setFormData({ ...formData, keyIssue: e.target.value })}
                placeholder="e.g., Education funding, public safety, infrastructure..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <Button 
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Content"}
            </Button>

            {generatedContent && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Generated Content</label>
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="bg-white/10 border-white/20 text-white min-h-[200px]"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={saveContent}
                    className="flex-1 bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
                  >
                    Save to Library
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => copyContent(generatedContent)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </CampaignLayout>
  );
}