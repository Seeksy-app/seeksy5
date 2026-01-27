/**
 * SeoAiSuggestionsPanel - AI SEO suggestions panel for SEO edit page
 * 
 * Shows linked GBP location, generation controls, run history, and apply/dismiss
 * Entry point is seo_page_id (vs GBP panel which uses location_id)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface SeoAiSuggestionsPanelProps {
  seoPageId: string;
  onSuggestionApplied?: () => void;
}

interface Suggestion {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  risk: "safe" | "review" | "risky";
  current_value: string | null;
  proposed_value: string;
  rationale: string;
  confidence: number;
  checks: {
    character_count_ok: boolean;
    no_prohibited_claims: boolean;
    no_sensitive_data: boolean;
  };
}

interface SuggestionRun {
  id: string;
  created_at: string;
  status: string;
  model: string;
  tone: string;
  include_reviews: boolean;
  include_faq: boolean;
  output_json: {
    summary?: {
      why: string;
      primary_focus_keywords: string[];
      secondary_keywords: string[];
      local_modifiers: string[];
    };
    suggestions?: Suggestion[];
    faq?: Array<{ question: string; answer: string; source: string }>;
    review_themes?: Array<{ theme: string; evidence_count: number }>;
  } | null;
  seo_page_id: string;
  gbp_location_id: string;
  applied_at: string | null;
  dismissed_at: string | null;
}

interface GbpLink {
  id: string;
  gbp_location_id: string;
  sync_status: string;
  gbp_locations: {
    id: string;
    title: string;
    address_json: any;
  } | null;
}

export function SeoAiSuggestionsPanel({ seoPageId, onSuggestionApplied }: SeoAiSuggestionsPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tone, setTone] = useState("Local");
  const [includeReviews, setIncludeReviews] = useState(true);
  const [includeFaq, setIncludeFaq] = useState(true);
  const [useProModel, setUseProModel] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingRun, setApplyingRun] = useState<SuggestionRun | null>(null);

  // Fetch linked GBP location
  const { data: gbpLink, isLoading: linkLoading } = useQuery({
    queryKey: ["seo-gbp-link-for-ai", seoPageId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("gbp_seo_links")
        .select(`
          id,
          gbp_location_id,
          sync_status,
          gbp_locations:gbp_location_id (
            id,
            title,
            address_json
          )
        `)
        .eq("seo_page_id", seoPageId)
        .maybeSingle();
      if (error) throw error;
      return data as GbpLink | null;
    },
  });

  // Fetch suggestion runs for this seo_page_id
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["seo-ai-suggestions-by-page", seoPageId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seo_ai_suggestions")
        .select("*")
        .eq("gbp_location_id", gbpLink?.gbp_location_id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SuggestionRun[];
    },
    enabled: !!gbpLink?.gbp_location_id,
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!gbpLink?.gbp_location_id) throw new Error("No GBP location linked");

      const { data, error } = await supabase.functions.invoke("seo-ai-suggest-from-gbp", {
        body: {
          seo_page_id: seoPageId,
          gbp_location_id: gbpLink.gbp_location_id,
          tone,
          include_reviews: includeReviews,
          include_faq: includeFaq,
          use_pro_model: useProModel,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success("AI suggestions generated successfully");
      queryClient.invalidateQueries({ queryKey: ["seo-ai-suggestions-by-page", seoPageId] });
      if (data?.seo_ai_suggestion_id) {
        setExpandedRunId(data.seo_ai_suggestion_id);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate suggestions");
    },
  });

  // Apply suggestions mutation
  const applyMutation = useMutation({
    mutationFn: async ({ runId, suggestions }: { runId: string; suggestions: Suggestion[] }) => {
      const updates: Record<string, any> = {};
      const appliedFields: string[] = [];

      suggestions.forEach((s) => {
        switch (s.type) {
          case "meta_title":
            updates.meta_title = s.proposed_value;
            appliedFields.push("meta_title");
            break;
          case "meta_description":
            updates.meta_description = s.proposed_value;
            appliedFields.push("meta_description");
            break;
          case "h1":
            updates.h1_override = s.proposed_value;
            appliedFields.push("h1_override");
            break;
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No applicable suggestions selected");
      }

      // Update SEO page draft
      const { error: updateError } = await (supabase as any)
        .from("seo_pages")
        .update(updates)
        .eq("id", seoPageId);

      if (updateError) throw updateError;

      const run = runs?.find((r) => r.id === runId);
      const totalSuggestions = run?.output_json?.suggestions?.length || 0;
      const newStatus = suggestions.length === totalSuggestions ? "applied" : "partial";

      const { error: statusError } = await (supabase as any)
        .from("seo_ai_suggestions")
        .update({
          status: newStatus,
        })
        .eq("id", runId);

      if (statusError) throw statusError;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("gbp_audit_log").insert({
        actor_user_id: user?.id,
        action_type: "SEO_AI_SUGGESTION_APPLIED",
        target_type: "seo_ai_suggestions",
        target_id: runId,
        details: {
          gbp_location_id: gbpLink?.gbp_location_id,
          seo_page_id: seoPageId,
          applied_fields: appliedFields,
        },
      });

      return { appliedFields };
    },
    onSuccess: (data) => {
      toast.success(`Applied ${data.appliedFields.length} changes to SEO draft`);
      queryClient.invalidateQueries({ queryKey: ["seo-ai-suggestions-by-page", seoPageId] });
      queryClient.invalidateQueries({ queryKey: ["seo-page", seoPageId] });
      setShowApplyModal(false);
      setApplyingRun(null);
      setSelectedSuggestions(new Set());
      onSuggestionApplied?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply suggestions");
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { error } = await (supabase as any)
        .from("seo_ai_suggestions")
        .update({
          status: "dismissed",
        })
        .eq("id", runId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("gbp_audit_log").insert({
        actor_user_id: user?.id,
        action_type: "SEO_AI_SUGGESTION_DISMISSED",
        target_type: "seo_ai_suggestions",
        target_id: runId,
        details: {
          gbp_location_id: gbpLink?.gbp_location_id,
          seo_page_id: seoPageId,
        },
      });
    },
    onSuccess: () => {
      toast.success("Suggestion run dismissed");
      queryClient.invalidateQueries({ queryKey: ["seo-ai-suggestions-by-page", seoPageId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to dismiss suggestions");
    },
  });

  const handleApply = (run: SuggestionRun) => {
    setApplyingRun(run);
    const safeSuggestions = run.output_json?.suggestions?.filter(
      (s) => s.risk === "safe" && s.checks.character_count_ok && s.checks.no_prohibited_claims && s.checks.no_sensitive_data
    ) || [];
    setSelectedSuggestions(new Set(safeSuggestions.map((s) => s.id)));
    setShowApplyModal(true);
  };

  const handleConfirmApply = () => {
    if (!applyingRun) return;
    const selectedList = applyingRun.output_json?.suggestions?.filter((s) => selectedSuggestions.has(s.id)) || [];
    applyMutation.mutate({ runId: applyingRun.id, suggestions: selectedList });
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "partial": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "dismissed": return "bg-muted text-muted-foreground";
      default: return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      default: return "text-muted-foreground";
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "safe": return <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs">Safe</Badge>;
      case "review": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 text-xs">Review</Badge>;
      case "risky": return <Badge variant="outline" className="bg-red-500/10 text-red-600 text-xs">Risky</Badge>;
      default: return null;
    }
  };

  const formatLocation = (addressJson: any) => {
    if (!addressJson) return null;
    const parts = [addressJson.locality, addressJson.administrativeArea].filter(Boolean);
    return parts.join(", ") || null;
  };

  if (linkLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!gbpLink) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggestions (from GBP)
            <Badge variant="outline" className="ml-2 text-xs">Draft-only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <p className="mb-3">Link a Google Business Profile location to use AI suggestions.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/gbp/locations")}>
              <MapPin className="h-3 w-3 mr-1" />
              Open GBP Locations
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const location = gbpLink.gbp_locations;
  const cityState = location ? formatLocation(location.address_json) : null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Suggestions (from GBP)
                <Badge variant="outline" className="ml-2 text-xs">Draft-only</Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Generate SEO improvements using GBP data and reviews
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linked Location */}
          <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{location?.title || "Unknown Location"}</p>
                {cityState && <p className="text-xs text-muted-foreground">{cityState}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/gbp/location/${location?.id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View GBP
            </Button>
          </div>

          {/* Generation Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Concise">Concise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="include-reviews-seo" checked={includeReviews} onCheckedChange={setIncludeReviews} />
              <Label htmlFor="include-reviews-seo" className="text-xs">Reviews</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="include-faq-seo" checked={includeFaq} onCheckedChange={setIncludeFaq} />
              <Label htmlFor="include-faq-seo" className="text-xs">FAQ</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="use-pro-seo" checked={useProModel} onCheckedChange={setUseProModel} />
              <Label htmlFor="use-pro-seo" className="text-xs">
                <Badge variant={useProModel ? "default" : "secondary"} className="text-xs">
                  {useProModel ? "GPT-5 Pro" : "GPT-5 Mini"}
                </Badge>
              </Label>
            </div>
          </div>

          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="w-full">
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Suggestions
              </>
            )}
          </Button>

          <Separator />

          {/* Run History */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent Runs
            </h4>
            {runsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : runs?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No suggestions generated yet
              </p>
            ) : (
              <div className="space-y-2">
                {runs?.map((run) => (
                  <div key={run.id} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(run.status)}`}>
                          {run.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {expandedRunId === run.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {expandedRunId === run.id && run.output_json && (
                      <div className="border-t p-3 space-y-3 bg-muted/20">
                        {run.output_json.suggestions && run.output_json.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">Suggestions ({run.output_json.suggestions.length})</p>
                            <ScrollArea className="h-[200px]">
                              <div className="space-y-2 pr-2">
                                {run.output_json.suggestions.map((s) => (
                                  <div key={s.id} className="p-2 border rounded text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium capitalize">{s.type.replace(/_/g, " ")}</span>
                                      <div className="flex items-center gap-1">
                                        {getRiskBadge(s.risk)}
                                        <span className={`text-xs ${getPriorityColor(s.priority)}`}>
                                          {s.priority}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2">{s.proposed_value}</p>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {run.status !== "applied" && run.status !== "dismissed" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApply(run)} className="flex-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Apply Selected
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => dismissMutation.mutate(run.id)}
                              disabled={dismissMutation.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply AI Suggestions</DialogTitle>
            <DialogDescription>
              Select which suggestions to apply to your SEO page draft.
            </DialogDescription>
          </DialogHeader>
          
          {applyingRun?.output_json?.suggestions && (
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {applyingRun.output_json.suggestions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSuggestions.has(s.id) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => toggleSuggestion(s.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedSuggestions.has(s.id)}
                        onCheckedChange={() => toggleSuggestion(s.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {s.type.replace(/_/g, " ")}
                          </span>
                          {getRiskBadge(s.risk)}
                        </div>
                        <p className="text-xs text-muted-foreground">{s.proposed_value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApply}
              disabled={selectedSuggestions.size === 0 || applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>Apply {selectedSuggestions.size} Suggestions</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
