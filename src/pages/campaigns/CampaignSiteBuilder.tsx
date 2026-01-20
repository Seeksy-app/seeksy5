import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Palette,
  FileText,
  Sparkles,
  Eye,
  Upload,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface CampaignSite {
  id: string;
  slug: string;
  brand_colors: { primary: string; accent: string };
  logo_url: string | null;
  slogan: string | null;
  about_copy: string | null;
  issues_copy: string | null;
  donate_url: string | null;
  is_published: boolean;
}

export default function CampaignSiteBuilder() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [site, setSite] = useState<Partial<CampaignSite>>({
    slug: "",
    brand_colors: { primary: "#1e3a5f", accent: "#d4af37" },
    logo_url: null,
    slogan: "",
    about_copy: "",
    issues_copy: "",
    donate_url: "",
    is_published: false
  });
  const [isGenerating, setIsGenerating] = useState(false);

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

    let { data: candidate } = await supabase
      .from("campaign_candidates")
      .select("id, display_name, office, jurisdiction")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!candidate) {
      const { data: newCandidate } = await supabase
        .from("campaign_candidates")
        .insert({ user_id: user.id, display_name: "My Campaign" })
        .select("id, display_name, office, jurisdiction")
        .single();
      candidate = newCandidate as typeof candidate;
    }

    if (candidate) {
      setCandidateId(candidate.id);
      setCandidateName(candidate.display_name || "");
      
      // Generate default slug
      const defaultSlug = candidate.display_name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "my-campaign";

      const { data: siteData } = await supabase
        .from("campaign_sites")
        .select("*")
        .eq("candidate_id", candidate.id)
        .maybeSingle();

      if (siteData) {
        setSite({
          ...siteData,
          brand_colors: siteData.brand_colors as { primary: string; accent: string }
        });
      } else {
        setSite(prev => ({ ...prev, slug: defaultSlug }));
      }
    }
    setLoading(false);
  };

  const generateContent = async (field: "about" | "issues") => {
    setIsGenerating(true);
    try {
      const prompt = field === "about"
        ? `Write a compelling "About" section for a campaign website for ${candidateName}. Keep it personal, authentic, and under 150 words. Focus on their story, values, and why they're running.`
        : `Write compelling "Issues" content for ${candidateName}'s campaign website. Cover 3-4 key issues with brief, clear explanations. Keep each issue to 2-3 sentences. Total under 200 words.`;

      const { data, error } = await supabase.functions.invoke("campaign-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          systemPrompt: "You are an expert political website copywriter. Write compelling, authentic content that connects with voters. Keep language at 8th grade reading level.",
          candidateId: user?.id
        }
      });

      if (error) throw error;
      
      if (field === "about") {
        setSite(prev => ({ ...prev, about_copy: data.response }));
      } else {
        setSite(prev => ({ ...prev, issues_copy: data.response }));
      }
      toast.success("Content generated!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSite = async () => {
    if (!candidateId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("campaign_sites")
        .upsert({
          candidate_id: candidateId,
          slug: site.slug,
          brand_colors: site.brand_colors,
          logo_url: site.logo_url,
          slogan: site.slogan,
          about_copy: site.about_copy,
          issues_copy: site.issues_copy,
          donate_url: site.donate_url,
          is_published: site.is_published
        }, {
          onConflict: "candidate_id"
        });

      if (error) throw error;
      toast.success("Site saved!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save site");
    } finally {
      setSaving(false);
    }
  };

  const publishSite = async () => {
    setSite(prev => ({ ...prev, is_published: true }));
    await saveSite();
    toast.success("Site published! Your campaign site is now live.");
  };

  if (loading) {
    return (
      <CampaignLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-white/60">Loading...</div>
        </div>
      </CampaignLayout>
    );
  }

  return (
    <CampaignLayout>
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Campaign Site Builder</h1>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={saveSite}
                disabled={saving}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button 
                onClick={publishSite}
                className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]"
              >
                <Globe className="h-4 w-4 mr-2" />
                Publish Site
              </Button>
            </div>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="bg-white/10 border-white/10">
              <TabsTrigger value="basic" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#0a1628]">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="branding" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#0a1628]">
                Branding
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-[#0a1628]">
                Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Site URL Slug</label>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">/c/</span>
                      <Input
                        value={site.slug}
                        onChange={(e) => setSite({ ...site, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                        placeholder="smith-for-council"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Campaign Slogan</label>
                    <Input
                      value={site.slogan || ""}
                      onChange={(e) => setSite({ ...site, slogan: e.target.value })}
                      placeholder="A Voice for Our Community"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Donate Link</label>
                    <Input
                      value={site.donate_url || ""}
                      onChange={(e) => setSite({ ...site, donate_url: e.target.value })}
                      placeholder="https://actblue.com/..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[#d4af37]" />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={site.brand_colors?.primary || "#1e3a5f"}
                          onChange={(e) => setSite({ 
                            ...site, 
                            brand_colors: { ...site.brand_colors!, primary: e.target.value }
                          })}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={site.brand_colors?.primary || "#1e3a5f"}
                          onChange={(e) => setSite({ 
                            ...site, 
                            brand_colors: { ...site.brand_colors!, primary: e.target.value }
                          })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={site.brand_colors?.accent || "#d4af37"}
                          onChange={(e) => setSite({ 
                            ...site, 
                            brand_colors: { ...site.brand_colors!, accent: e.target.value }
                          })}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={site.brand_colors?.accent || "#d4af37"}
                          onChange={(e) => setSite({ 
                            ...site, 
                            brand_colors: { ...site.brand_colors!, accent: e.target.value }
                          })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Logo URL (optional)</label>
                    <Input
                      value={site.logo_url || ""}
                      onChange={(e) => setSite({ ...site, logo_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">About Section</CardTitle>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => generateContent("about")}
                      disabled={isGenerating}
                      className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={site.about_copy || ""}
                      onChange={(e) => setSite({ ...site, about_copy: e.target.value })}
                      placeholder="Tell voters about yourself, your background, and why you're running..."
                      className="bg-white/10 border-white/20 text-white min-h-[150px]"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Key Issues</CardTitle>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => generateContent("issues")}
                      disabled={isGenerating}
                      className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={site.issues_copy || ""}
                      onChange={(e) => setSite({ ...site, issues_copy: e.target.value })}
                      placeholder="Describe your key issues and positions..."
                      className="bg-white/10 border-white/20 text-white min-h-[150px]"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#d4af37]" />
              Live Preview
            </h2>
            {site.is_published && (
              <Badge className="bg-green-500/20 text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Published
              </Badge>
            )}
          </div>

          <Card className="bg-white border-0 overflow-hidden">
            <div 
              className="p-6 text-center"
              style={{ backgroundColor: site.brand_colors?.primary || "#1e3a5f" }}
            >
              {site.logo_url ? (
                <img src={site.logo_url} alt="Logo" className="h-16 mx-auto mb-4" />
              ) : (
                <div 
                  className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: site.brand_colors?.accent || "#d4af37", color: site.brand_colors?.primary || "#1e3a5f" }}
                >
                  {candidateName.charAt(0)}
                </div>
              )}
              <h1 className="text-2xl font-bold text-white mb-2">{candidateName}</h1>
              {site.slogan && (
                <p className="text-white/80 italic">{site.slogan}</p>
              )}
              {site.donate_url && (
                <Button 
                  className="mt-4"
                  style={{ backgroundColor: site.brand_colors?.accent || "#d4af37", color: site.brand_colors?.primary || "#1e3a5f" }}
                >
                  Donate Now
                </Button>
              )}
            </div>
            <CardContent className="p-6 space-y-6">
              {site.about_copy && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 text-sm">{site.about_copy}</p>
                </div>
              )}
              {site.issues_copy && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Issues</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{site.issues_copy}</p>
                </div>
              )}
              {!site.about_copy && !site.issues_copy && (
                <p className="text-gray-400 text-center py-8">Add content to see it here</p>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-white/40 text-center">
            Preview URL: /c/{site.slug || "your-campaign"}
          </p>
        </div>
      </div>
    </CampaignLayout>
  );
}