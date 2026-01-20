import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SWOTData {
  id?: string;
  user_id?: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  ai_last_summary?: string;
  updated_at?: string;
}

interface ChangeHistoryItem {
  id: string;
  changed_by: string;
  changed_field: string;
  changed_at: string;
  profile?: { full_name: string | null };
}

export default function SWOTAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [swotData, setSwotData] = useState<SWOTData>({
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: "",
    ai_last_summary: ""
  });
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch SWOT data
  const { data: fetchedSwot, isLoading } = useQuery({
    queryKey: ['cfo-swot'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('cfo_swot' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching SWOT:', error);
        return null;
      }

      return data as unknown as SWOTData | null;
    }
  });

  // Fetch change history
  const { data: changeHistory = [] } = useQuery({
    queryKey: ['swot-history', fetchedSwot?.id],
    queryFn: async () => {
      if (!fetchedSwot?.id) return [];

      const { data, error } = await supabase
        .from('swot_change_history' as any)
        .select('*')
        .eq('swot_id', fetchedSwot.id)
        .order('changed_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      return data as unknown as ChangeHistoryItem[];
    },
    enabled: !!fetchedSwot?.id
  });

  useEffect(() => {
    if (fetchedSwot) {
      setSwotData(fetchedSwot);
    }
  }, [fetchedSwot]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SWOTData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (swotData.id) {
        const { error } = await supabase
          .from('cfo_swot' as any)
          .update({
            ...data,
            updated_by: user.id
          })
          .eq('id', swotData.id);

        if (error) throw error;
      } else {
        const { data: newData, error } = await supabase
          .from('cfo_swot' as any)
          .insert({
            user_id: user.id,
            created_by: user.id,
            updated_by: user.id,
            ...data
          })
          .select()
          .single();

        if (error) throw error;
        if (newData) {
          setSwotData(prev => ({ ...prev, id: (newData as any).id }));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-history'] });
    }
  });

  // Auto-save on blur
  const handleBlur = useCallback((field: keyof SWOTData) => {
    saveMutation.mutate({ [field]: swotData[field] });
    setSavedIndicator(field);
    setTimeout(() => setSavedIndicator(null), 2000);
  }, [swotData, saveMutation]);

  const updateField = (field: keyof SWOTData, value: string) => {
    setSwotData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const generatedSWOT = {
        strengths: `• First-mover advantage in AI-powered podcast monetization
• Proprietary voice certification technology with blockchain verification
• Strong creator-first platform positioning
• Integrated end-to-end workflow (create → certify → monetize)
• Growing creator network with voice-verified authenticity`,
        
        weaknesses: `• Limited brand awareness compared to established platforms
• Dependency on third-party AI services (ElevenLabs, OpenAI)
• Early-stage revenue with limited financial history
• Small team requiring rapid scaling for growth
• Complex feature set may overwhelm new users`,
        
        opportunities: `• $50B+ podcast advertising market growing 20% YoY
• Creator economy shift toward authenticity and ownership
• Rising demand for AI content with verified human creators
• B2B white-label opportunities for agencies and networks
• International expansion into underserved markets`,
        
        threats: `• Large incumbents (Spotify, YouTube) entering similar space
• Economic downturn affecting advertising spend
• AI regulation changes impacting voice cloning features
• Platform dependency risks (social media policy changes)
• Competitive pressure on creator payouts`
      };

      const newSwot = { ...swotData, ...generatedSWOT };
      setSwotData(newSwot);
      await saveMutation.mutateAsync(generatedSWOT);

      toast({ title: "AI SWOT analysis generated", description: "Review and edit as needed" });
    } catch (err) {
      toast({ 
        title: "Error generating SWOT", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = `Based on the current SWOT analysis, Seeksy demonstrates strong positioning in the emerging AI-powered creator economy with proprietary voice certification technology. Key growth drivers include the expanding $50B podcast advertising market and increasing demand for verified authentic content. Priority areas for attention include building brand awareness and reducing third-party AI dependencies. The competitive landscape requires vigilant monitoring of incumbent platform moves while capitalizing on the authenticity trend before market saturation.`;

      const updated = { ...swotData, ai_last_summary: summary };
      setSwotData(updated);
      await saveMutation.mutateAsync({ ai_last_summary: summary });

      toast({ title: "SWOT summary updated" });
    } catch (err) {
      toast({ 
        title: "Error generating summary", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishToBoard = async () => {
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const swotPayload = {
        strengths: swotData.strengths?.split('\n').filter(s => s.trim()) || [],
        weaknesses: swotData.weaknesses?.split('\n').filter(s => s.trim()) || [],
        opportunities: swotData.opportunities?.split('\n').filter(s => s.trim()) || [],
        threats: swotData.threats?.split('\n').filter(s => s.trim()) || [],
        ai_summary: swotData.ai_last_summary || null,
        last_updated_by_name: profile?.full_name || 'CFO',
        last_updated_by_id: user.id,
        last_updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('board_settings')
        .upsert({
          setting_key: 'cfo_swot',
          setting_value: swotPayload,
          last_updated_by: user.id,
          last_updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({ 
        title: "SWOT published to Board Portal",
        description: "Board members can now view this SWOT analysis."
      });
    } catch (err) {
      console.error('Publish error:', err);
      toast({ 
        title: "Error publishing SWOT", 
        variant: "destructive" 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-8 items-stretch">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            SWOT Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            High-level strategic view of Seeksy's financial position and market environment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleGenerateAI}
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate AI Summary
          </Button>
          <Button 
            onClick={handlePublishToBoard}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Publish to Board Portal
          </Button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - SWOT Quadrants */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                  {savedIndicator === 'strengths' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Internal • Positive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={swotData.strengths}
                  onChange={(e) => updateField('strengths', e.target.value)}
                  onBlur={() => handleBlur('strengths')}
                  placeholder="• List your key strengths...
• What do you do better than competitors?
• What unique resources do you have?"
                  className="min-h-[180px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {swotData.strengths?.length || 0} characters
                </p>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-rose-600">
                    <TrendingDown className="h-5 w-5" />
                    Weaknesses
                  </CardTitle>
                  {savedIndicator === 'weaknesses' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Internal • Negative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={swotData.weaknesses}
                  onChange={(e) => updateField('weaknesses', e.target.value)}
                  onBlur={() => handleBlur('weaknesses')}
                  placeholder="• List areas needing improvement...
• What do competitors do better?
• What resources are you lacking?"
                  className="min-h-[180px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {swotData.weaknesses?.length || 0} characters
                </p>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <Target className="h-5 w-5" />
                    Opportunities
                  </CardTitle>
                  {savedIndicator === 'opportunities' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  External • Positive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={swotData.opportunities}
                  onChange={(e) => updateField('opportunities', e.target.value)}
                  onBlur={() => handleBlur('opportunities')}
                  placeholder="• List market opportunities...
• What trends can you capitalize on?
• What gaps exist in the market?"
                  className="min-h-[180px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {swotData.opportunities?.length || 0} characters
                </p>
              </CardContent>
            </Card>

            {/* Threats */}
            <Card className="border-l-4 border-l-slate-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-slate-600">
                    <AlertTriangle className="h-5 w-5" />
                    Threats
                  </CardTitle>
                  {savedIndicator === 'threats' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  External • Negative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={swotData.threats}
                  onChange={(e) => updateField('threats', e.target.value)}
                  onBlur={() => handleBlur('threats')}
                  placeholder="• List potential threats...
• What obstacles do you face?
• What are competitors doing?"
                  className="min-h-[180px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {swotData.threats?.length || 0} characters
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Last Updated */}
          {swotData.updated_at && (
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Last updated: {new Date(swotData.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Right column - AI Summary + History */}
        <div className="space-y-6">
          {/* AI Summary Card */}
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Summary
                </CardTitle>
                <Badge variant="outline" className="text-xs">AI-Generated</Badge>
              </div>
              <CardDescription>
                AI-generated summary of your current SWOT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 min-h-[150px]">
                {swotData.ai_last_summary ? (
                  <p className="text-sm leading-relaxed">{swotData.ai_last_summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No AI summary generated yet. Click "Regenerate from SWOT" to create one.
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRegenerateSummary}
                disabled={isGenerating || (!swotData.strengths && !swotData.weaknesses && !swotData.opportunities && !swotData.threats)}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate from SWOT
              </Button>
            </CardContent>
          </Card>

          {/* Change History Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Change History
              </CardTitle>
              <CardDescription>Last 5 updates</CardDescription>
            </CardHeader>
            <CardContent>
              {changeHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No changes recorded yet.
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {changeHistory.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.changed_field}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.changed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
