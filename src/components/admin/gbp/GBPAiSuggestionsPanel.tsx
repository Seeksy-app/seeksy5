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
  FileText,
  Zap,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface GBPAiSuggestionsPanelProps {
  locationId: string;
  gbpLocationId: string; // The location_id field used in gbp_seo_links
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
  applied_at: string | null;
  dismissed_at: string | null;
}

export function GBPAiSuggestionsPanel({ locationId, gbpLocationId }: GBPAiSuggestionsPanelProps) {
  const queryClient = useQueryClient();
  const [tone, setTone] = useState("Local");
  const [includeReviews, setIncludeReviews] = useState(true);
  const [includeFaq, setIncludeFaq] = useState(true);
  const [useProModel, setUseProModel] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingRun, setApplyingRun] = useState<SuggestionRun | null>(null);

  // Check if SEO link exists
  const { data: seoLink, isLoading: linkLoading } = useQuery({
    queryKey: ["gbp-seo-link", locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gbp_seo_links")
        .select("id, seo_page_id, sync_status")
        .eq("gbp_location_id", locationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch suggestion runs
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["seo-ai-suggestions", locationId],
    queryFn: async () => {
      if (!seoLink?.seo_page_id) return [];
      const { data, error } = await supabase
        .from("seo_ai_suggestions")
        .select("*")
        .eq("gbp_location_id", locationId)
        .eq("seo_page_id", seoLink.seo_page_id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as SuggestionRun[];
    },
    enabled: !!seoLink?.seo_page_id,
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!seoLink?.seo_page_id) throw new Error("No SEO page linked");
      
      const { data, error } = await supabase.functions.invoke("seo-ai-suggest-from-gbp", {
        body: {
          seo_page_id: seoLink.seo_page_id,
          gbp_location_id: locationId,
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
      queryClient.invalidateQueries({ queryKey: ["seo-ai-suggestions", locationId] });
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
      if (!seoLink?.seo_page_id) throw new Error("No SEO page linked");

      // Build update object from selected suggestions
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
          case "og_title":
            updates.og_title = s.proposed_value;
            appliedFields.push("og_title");
            break;
          case "og_description":
            updates.og_description = s.proposed_value;
            appliedFields.push("og_description");
            break;
          case "og_alt":
            updates.og_image_alt = s.proposed_value;
            appliedFields.push("og_image_alt");
            break;
          case "twitter_title":
            updates.twitter_title = s.proposed_value;
            appliedFields.push("twitter_title");
            break;
          case "twitter_description":
            updates.twitter_description = s.proposed_value;
            appliedFields.push("twitter_description");
            break;
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No applicable suggestions selected");
      }

      // Update SEO page draft
      const { error: updateError } = await supabase
        .from("seo_pages")
        .update(updates)
        .eq("id", seoLink.seo_page_id);

      if (updateError) throw updateError;

      // Get the run to check total suggestions
      const run = runs?.find((r) => r.id === runId);
      const totalSuggestions = run?.output_json?.suggestions?.length || 0;
      const newStatus = suggestions.length === totalSuggestions ? "applied" : "partial";

      // Update suggestion run status
      const { error: statusError } = await supabase
        .from("seo_ai_suggestions")
        .update({
          status: newStatus,
          applied_at: new Date().toISOString(),
        })
        .eq("id", runId);

      if (statusError) throw statusError;

      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("gbp_audit_log").insert({
        user_id: user?.id,
        action_type: "SEO_AI_SUGGESTION_APPLIED",
        entity_type: "seo_ai_suggestions",
        entity_id: runId,
        location_id: locationId,
        details: {
          gbp_location_id: locationId,
          seo_page_id: seoLink.seo_page_id,
          applied_fields: appliedFields,
          applied_suggestion_ids: suggestions.map((s) => s.id),
        },
      });

      return { appliedFields };
    },
    onSuccess: (data) => {
      toast.success(`Applied ${data.appliedFields.length} changes to SEO draft`);
      queryClient.invalidateQueries({ queryKey: ["seo-ai-suggestions", locationId] });
      setShowApplyModal(false);
      setApplyingRun(null);
      setSelectedSuggestions(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply suggestions");
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { error } = await supabase
        .from("seo_ai_suggestions")
        .update({
          status: "dismissed",
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", runId);

      if (error) throw error;

      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("gbp_audit_log").insert({
        user_id: user?.id,
        action_type: "SEO_AI_SUGGESTION_DISMISSED",
        entity_type: "seo_ai_suggestions",
        entity_id: runId,
        location_id: locationId,
        details: {
          gbp_location_id: locationId,
          seo_page_id: seoLink?.seo_page_id,
          suggestion_run_id: runId,
        },
      });
    },
    onSuccess: () => {
      toast.success("Suggestion run dismissed");
      queryClient.invalidateQueries({ queryKey: ["seo-ai-suggestions", locationId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to dismiss suggestions");
    },
  });

  const handleApply = (run: SuggestionRun) => {
    setApplyingRun(run);
    // Pre-select safe suggestions
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "partial":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "dismissed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "safe":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs">Safe</Badge>;
      case "review":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 text-xs">Review</Badge>;
      case "risky":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 text-xs">Risky</Badge>;
      default:
        return null;
    }
  };

  if (linkLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!seoLink) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI SEO Suggestions
            <Badge variant="outline" className="ml-2 text-xs">Draft-only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <p>Link an SEO page to this location first to generate AI suggestions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI SEO Suggestions
                <Badge variant="outline" className="ml-2 text-xs">Draft-only</Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Generate SEO improvements using GBP data and reviews
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Switch
                id="include-reviews"
                checked={includeReviews}
                onCheckedChange={setIncludeReviews}
              />
              <Label htmlFor="include-reviews" className="text-xs">Reviews</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="include-faq"
                checked={includeFaq}
                onCheckedChange={setIncludeFaq}
              />
              <Label htmlFor="include-faq" className="text-xs">FAQ</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="use-pro"
                checked={useProModel}
                onCheckedChange={setUseProModel}
              />
              <Label htmlFor="use-pro" className="text-xs">
                <Badge variant={useProModel ? "default" : "secondary"} className="text-xs">
                  {useProModel ? "GPT-5 Pro" : "GPT-5 Mini"}
                </Badge>
              </Label>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
          >
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
                        <Badge variant="secondary" className="text-xs">
                          {run.model.includes("gpt-5") && !run.model.includes("mini") ? "Pro" : "Mini"}
                        </Badge>
                      </div>
                      {expandedRunId === run.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedRunId === run.id && run.output_json && (
                      <div className="border-t p-3 space-y-3 bg-muted/20">
                        {/* Summary */}
                        {run.output_json.summary && (
                          <div className="text-xs space-y-1">
                            <p className="text-muted-foreground">{run.output_json.summary.why}</p>
                            <div className="flex flex-wrap gap-1">
                              {run.output_json.summary.primary_focus_keywords?.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggestions Preview */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium">
                            {run.output_json.suggestions?.length || 0} suggestions
                          </p>
                          <div className="grid gap-1">
                            {run.output_json.suggestions?.slice(0, 3).map((s) => (
                              <div
                                key={s.id}
                                className="text-xs p-2 bg-background rounded flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{s.type}</Badge>
                                  <span className={`text-xs ${getPriorityColor(s.priority)}`}>
                                    {s.priority}
                                  </span>
                                </div>
                                {getRiskBadge(s.risk)}
                              </div>
                            ))}
                            {(run.output_json.suggestions?.length || 0) > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{(run.output_json.suggestions?.length || 0) - 3} more
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {run.status === "draft" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1"
                              onClick={() => handleApply(run)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Review & Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissMutation.mutate(run.id)}
                              disabled={dismissMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" />
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Apply SEO Suggestions</DialogTitle>
            <DialogDescription>
              Select suggestions to apply to the SEO page draft. Changes will not be published automatically.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-3">
              {applyingRun?.output_json?.suggestions?.map((s) => (
                <div
                  key={s.id}
                  className={`border rounded-lg p-3 space-y-2 ${
                    selectedSuggestions.has(s.id) ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={s.id}
                      checked={selectedSuggestions.has(s.id)}
                      onCheckedChange={() => toggleSuggestion(s.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{s.type}</Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(s.priority)}
                        >
                          {s.priority}
                        </Badge>
                        {getRiskBadge(s.risk)}
                        <span className="text-xs text-muted-foreground">
                          {Math.round(s.confidence * 100)}% confident
                        </span>
                      </div>

                      {s.current_value && (
                        <div className="text-xs">
                          <p className="text-muted-foreground mb-1">Current:</p>
                          <div className="p-2 bg-muted rounded text-foreground/80">
                            {s.current_value}
                          </div>
                        </div>
                      )}

                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Proposed:</p>
                        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
                          {s.proposed_value}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">{s.rationale}</p>

                      {/* Checks */}
                      <div className="flex gap-2 text-xs">
                        {s.checks.character_count_ok ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Length OK
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Length issue
                          </span>
                        )}
                        {s.checks.no_prohibited_claims ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> No claims
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Has claims
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                {selectedSuggestions.size} of {applyingRun?.output_json?.suggestions?.length || 0} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmApply}
                  disabled={applyMutation.isPending || selectedSuggestions.size === 0}
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Apply to Draft
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
