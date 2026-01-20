import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  Megaphone, 
  ListTodo, 
  Calculator,
  BarChart3,
  Plus,
  Sparkles,
  Download,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface GTMProject {
  id: string;
  name: string;
  description: string | null;
  primary_goal: string | null;
  status: string;
  mode: string;
  timeframe: string | null;
  budget_range: string | null;
  onboarding_data: any;
  created_at: string;
  updated_at: string;
}

interface GTMChannel {
  id: string;
  gtm_project_id: string;
  channel_type: string;
  priority: number;
  notes: string | null;
}

interface GTMAction {
  id: string;
  gtm_project_id: string;
  channel_id: string | null;
  title: string;
  description: string | null;
  owner_role: string | null;
  due_date: string | null;
  effort_estimate: string | null;
  impact_estimate: string | null;
  status: string;
}

interface GTMAssumption {
  id: string;
  gtm_project_id: string;
  category: string;
  label: string;
  value_numeric: number | null;
  value_text: string | null;
  is_key_assumption: boolean;
}

export default function GTMWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['gtm-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtm_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as GTMProject;
    },
    enabled: !!id,
  });

  // Fetch channels
  const { data: channels = [] } = useQuery({
    queryKey: ['gtm-channels', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtm_project_channels')
        .select('*')
        .eq('gtm_project_id', id)
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as GTMChannel[];
    },
    enabled: !!id,
  });

  // Fetch actions
  const { data: actions = [] } = useQuery({
    queryKey: ['gtm-actions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtm_actions')
        .select('*')
        .eq('gtm_project_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GTMAction[];
    },
    enabled: !!id,
  });

  // Fetch assumptions
  const { data: assumptions = [] } = useQuery({
    queryKey: ['gtm-assumptions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtm_assumptions')
        .select('*')
        .eq('gtm_project_id', id)
        .order('is_key_assumption', { ascending: false });
      if (error) throw error;
      return data as GTMAssumption[];
    },
    enabled: !!id,
  });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/business-tools/gtm')}>Back to GTM Builder</Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'planned': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/business-tools/gtm')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
              {project.mode === 'admin_cfo' && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Internal CFO
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {project.description || 'No description'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled>
              <Sparkles className="w-4 h-4" />
              Refine Plan
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="summary" className="gap-2">
              <Target className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <Megaphone className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <ListTodo className="w-4 h-4" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="assumptions" className="gap-2">
              <Calculator className="w-4 h-4" />
              Assumptions
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Metrics
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <SummaryTab 
              project={project} 
              channelsCount={channels.length}
              actionsCount={actions.length}
              assumptionsCount={assumptions.filter(a => a.is_key_assumption).length}
            />
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <ChannelsTab projectId={id!} channels={channels} />
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions">
            <ActionsTab projectId={id!} actions={actions} channels={channels} />
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions">
            <AssumptionsTab projectId={id!} assumptions={assumptions} />
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <MetricsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Summary Tab Component
function SummaryTab({ 
  project, 
  channelsCount, 
  actionsCount, 
  assumptionsCount 
}: { 
  project: GTMProject;
  channelsCount: number;
  actionsCount: number;
  assumptionsCount: number;
}) {
  const goals = project.onboarding_data?.goals || [];
  
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Goals</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {goals.length > 0 ? goals.map((goal: string) => (
                  <Badge key={goal} variant="secondary">{goal.replace(/_/g, ' ')}</Badge>
                )) : (
                  <span className="text-muted-foreground">No goals set</span>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Timeframe</h4>
                <p className="mt-1">{project.timeframe || 'Not set'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Budget Range</h4>
                <p className="mt-1">{project.budget_range || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channels</span>
              <span className="font-semibold">{channelsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actions</span>
              <span className="font-semibold">{actionsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Key Assumptions</span>
              <span className="font-semibold">{assumptionsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Channels Tab Component
function ChannelsTab({ projectId, channels }: { projectId: string; channels: GTMChannel[] }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ channel_type: '', priority: 3, notes: '' });

  const addChannelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('gtm_project_channels').insert({
        gtm_project_id: projectId,
        ...newChannel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-channels', projectId] });
      setIsAddOpen(false);
      setNewChannel({ channel_type: '', priority: 3, notes: '' });
      toast.success('Channel added');
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase.from('gtm_project_channels').delete().eq('id', channelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-channels', projectId] });
      toast.success('Channel removed');
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Marketing channels for your GTM strategy</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Channel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Channel Type</Label>
                <Input
                  placeholder="e.g., Podcast Guesting"
                  value={newChannel.channel_type}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channel_type: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority (1-5)</Label>
                <Select 
                  value={String(newChannel.priority)} 
                  onValueChange={(v) => setNewChannel(prev => ({ ...prev, priority: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(p => (
                      <SelectItem key={p} value={String(p)}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any notes about this channel..."
                  value={newChannel.notes}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => addChannelMutation.mutate()} disabled={!newChannel.channel_type}>
                Add Channel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No channels added yet. Add your first marketing channel.
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{channel.channel_type}</h4>
                    {channel.notes && <p className="text-sm text-muted-foreground">{channel.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Priority: {channel.priority}</Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteChannelMutation.mutate(channel.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Actions Tab Component
function ActionsTab({ projectId, actions, channels }: { projectId: string; actions: GTMAction[]; channels: GTMChannel[] }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    channel_id: '',
    status: 'idea',
    effort_estimate: 'medium',
    impact_estimate: 'medium',
  });

  const addActionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('gtm_actions').insert({
        gtm_project_id: projectId,
        ...newAction,
        channel_id: newAction.channel_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-actions', projectId] });
      setIsAddOpen(false);
      setNewAction({ title: '', description: '', channel_id: '', status: 'idea', effort_estimate: 'medium', impact_estimate: 'medium' });
      toast.success('Action added');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ actionId, status }: { actionId: string; status: string }) => {
      const { error } = await supabase.from('gtm_actions').update({ status }).eq('id', actionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-actions', projectId] });
    },
  });

  const statusGroups = {
    idea: actions.filter(a => a.status === 'idea'),
    planned: actions.filter(a => a.status === 'planned'),
    in_progress: actions.filter(a => a.status === 'in_progress'),
    completed: actions.filter(a => a.status === 'completed'),
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Action</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., Reach out to 10 podcasts for guesting"
                  value={newAction.title}
                  onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Details about this action..."
                  value={newAction.description}
                  onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select 
                    value={newAction.channel_id} 
                    onValueChange={(v) => setNewAction(prev => ({ ...prev, channel_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.channel_type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newAction.status} 
                    onValueChange={(v) => setNewAction(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => addActionMutation.mutate()} disabled={!newAction.title}>
                Add Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(statusGroups).map(([status, items]) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium capitalize">{status.replace('_', ' ')}</CardTitle>
              <CardDescription>{items.length} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(action => (
                <div key={action.id} className="p-3 border rounded-lg text-sm">
                  <p className="font-medium">{action.title}</p>
                  {action.description && (
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{action.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Assumptions Tab Component
function AssumptionsTab({ projectId, assumptions }: { projectId: string; assumptions: GTMAssumption[] }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAssumption, setNewAssumption] = useState({
    category: 'traffic',
    label: '',
    value_numeric: '',
    value_text: '',
    is_key_assumption: false,
  });

  const addAssumptionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('gtm_assumptions').insert({
        gtm_project_id: projectId,
        category: newAssumption.category,
        label: newAssumption.label,
        value_numeric: newAssumption.value_numeric ? Number(newAssumption.value_numeric) : null,
        value_text: newAssumption.value_text || null,
        is_key_assumption: newAssumption.is_key_assumption,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtm-assumptions', projectId] });
      setIsAddOpen(false);
      setNewAssumption({ category: 'traffic', label: '', value_numeric: '', value_text: '', is_key_assumption: false });
      toast.success('Assumption added');
    },
  });

  const keyAssumptions = assumptions.filter(a => a.is_key_assumption);
  const otherAssumptions = assumptions.filter(a => !a.is_key_assumption);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Assumption</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Assumption</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newAssumption.category} 
                  onValueChange={(v) => setNewAssumption(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="ARPU">ARPU</SelectItem>
                    <SelectItem value="churn">Churn</SelectItem>
                    <SelectItem value="sponsorship_rate">Sponsorship Rate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label *</Label>
                <Input
                  placeholder="e.g., Monthly website visitors"
                  value={newAssumption.label}
                  onChange={(e) => setNewAssumption(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numeric Value</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1000"
                    value={newAssumption.value_numeric}
                    onChange={(e) => setNewAssumption(prev => ({ ...prev, value_numeric: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Text Value</Label>
                  <Input
                    placeholder="e.g., High growth"
                    value={newAssumption.value_text}
                    onChange={(e) => setNewAssumption(prev => ({ ...prev, value_text: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => addAssumptionMutation.mutate()} disabled={!newAssumption.label}>
                Add Assumption
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {keyAssumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keyAssumptions.map(a => (
                <div key={a.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">{a.category}</span>
                    <p className="font-medium">{a.label}</p>
                  </div>
                  <span className="font-semibold">
                    {a.value_numeric ?? a.value_text ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          {assumptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assumptions added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {otherAssumptions.map(a => (
                <div key={a.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">{a.category}</span>
                    <p className="font-medium">{a.label}</p>
                  </div>
                  <span className="font-semibold">
                    {a.value_numeric ?? a.value_text ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Metrics Tab Component (placeholder for future)
function MetricsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics & Benchmarks</CardTitle>
        <CardDescription>Coming soon - powered by R&D Intelligence</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Metrics Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We'll soon overlay real benchmarks here from our R&D Intelligence engine, 
            allowing you to track your progress against industry standards.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
