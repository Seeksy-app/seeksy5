/**
 * Lead Intelligence Scoring Rules Page
 * 
 * Create and manage intent scoring rules with preview and recompute.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Target, Plus, Edit2, Trash2, Play, Loader2,
  Zap, Calculator, CheckCircle2, Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ScoringRuleData {
  event_weights?: Record<string, number>;
  decay_enabled?: boolean;
  decay_half_life_days?: number;
  provider_multipliers?: Record<string, number>;
}

interface ScoringRule {
  id: string;
  name: string;
  enabled: boolean;
  rules: ScoringRuleData | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_EVENT_WEIGHTS: Record<string, number> = {
  page_view: 1,
  pricing_view: 10,
  demo_click: 15,
  checkout_start: 20,
  form_submit: 25,
  signup: 30,
  webhook_match: 5,
};

function LeadsRulesContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [eventWeights, setEventWeights] = useState<Record<string, number>>(DEFAULT_EVENT_WEIGHTS);
  const [decayEnabled, setDecayEnabled] = useState(true);
  const [decayDays, setDecayDays] = useState(14);

  // Fetch workspaces
  const { data: workspaces } = useQuery({
    queryKey: ['lead-workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const activeWorkspace = workspaces?.[0];

  // Fetch scoring rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ['lead-scoring-rules', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        rules: d.rules as ScoringRuleData | null
      })) as ScoringRule[];
    },
    enabled: !!activeWorkspace?.id
  });

  // Save rule mutation
  const saveRule = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const ruleData = {
        workspace_id: activeWorkspace.id,
        name: ruleName,
        enabled: true,
        rules: {
          event_weights: eventWeights,
          decay_enabled: decayEnabled,
          decay_half_life_days: decayDays,
          provider_multipliers: { warmly: 1.0, opensend: 1.0, pixel: 0.8 }
        }
      };

      if (editingRule) {
        const { error } = await supabase
          .from('lead_scoring_rules')
          .update({ ...ruleData, updated_at: new Date().toISOString() })
          .eq('id', editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lead_scoring_rules')
          .insert(ruleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules', activeWorkspace?.id] });
      toast.success(editingRule ? "Rule updated!" : "Rule created!");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error("Failed to save rule", { description: err.message });
    }
  });

  // Toggle rule mutation
  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('lead_scoring_rules')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules', activeWorkspace?.id] });
    }
  });

  // Delete rule mutation
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lead_scoring_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules', activeWorkspace?.id] });
      toast.success("Rule deleted");
    }
  });

  // Recompute scores
  const recomputeScores = async () => {
    if (!activeWorkspace?.id) return;
    setIsRecomputing(true);
    
    try {
      const { error } = await supabase.functions.invoke('lead-score-recompute', {
        body: { workspace_id: activeWorkspace.id }
      });
      
      if (error) throw error;
      toast.success("Scores are being recomputed!");
    } catch (err: any) {
      toast.error("Failed to recompute", { description: err.message });
    } finally {
      setIsRecomputing(false);
    }
  };

  const resetForm = () => {
    setRuleName("");
    setEventWeights(DEFAULT_EVENT_WEIGHTS);
    setDecayEnabled(true);
    setDecayDays(14);
    setEditingRule(null);
  };

  const openEditDialog = (rule: ScoringRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setEventWeights(rule.rules?.event_weights || DEFAULT_EVENT_WEIGHTS);
    setDecayEnabled(rule.rules?.decay_enabled ?? true);
    setDecayDays(rule.rules?.decay_half_life_days || 14);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (!activeWorkspace) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Workspace Found</h2>
          <Button onClick={() => navigate('/admin/leads/setup')}>Setup Workspace</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Scoring Rules
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure how lead intent scores are calculated
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={recomputeScores}
            disabled={isRecomputing}
          >
            {isRecomputing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Recompute All Scores
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Scoring Rule'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    placeholder="e.g., Default Scoring"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Event Weights</Label>
                  <p className="text-sm text-muted-foreground">
                    Set point values for each event type
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(eventWeights).map(([event, weight]) => (
                      <div key={event} className="flex items-center gap-3">
                        <Label className="w-32 text-sm capitalize">
                          {event.replace('_', ' ')}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={weight}
                          onChange={(e) => setEventWeights({
                            ...eventWeights,
                            [event]: parseInt(e.target.value) || 0
                          })}
                          className="w-20"
                        />
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Score Decay</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce scores over time for inactive leads
                      </p>
                    </div>
                    <Switch
                      checked={decayEnabled}
                      onCheckedChange={setDecayEnabled}
                    />
                  </div>
                  {decayEnabled && (
                    <div className="space-y-2">
                      <Label>Half-life (days): {decayDays}</Label>
                      <Slider
                        value={[decayDays]}
                        onValueChange={([v]) => setDecayDays(v)}
                        min={1}
                        max={90}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Score will be halved every {decayDays} days of inactivity
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => saveRule.mutate()}
                    disabled={!ruleName.trim() || saveRule.isPending}
                  >
                    {saveRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rules Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !rules?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <Calculator className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No scoring rules yet</p>
              <p className="text-sm">Create a rule to start calculating intent scores.</p>
              <Button className="mt-4" onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Event Types</TableHead>
                  <TableHead>Decay</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => toggleRule.mutate({ id: rule.id, enabled })}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {Object.keys(rule.rules?.event_weights || {}).length} events
                      </span>
                    </TableCell>
                    <TableCell>
                      {rule.rules?.decay_enabled ? (
                        <Badge variant="secondary">
                          {rule.rules?.decay_half_life_days}d half-life
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(rule.updated_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Score Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Preview</CardTitle>
          <CardDescription>
            See how a lead's score would be calculated based on their activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a lead from the dashboard to preview their score breakdown.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadsRules() {
  return (
    <RequireAdmin>
      <LeadsRulesContent />
    </RequireAdmin>
  );
}
