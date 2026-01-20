import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MilestoneCategory = 'product' | 'engineering' | 'growth' | 'fundraising' | 'ops';
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'blocked';
export type ProgressType = 'manual' | 'subtask' | 'metric';

export interface MilestoneSubtask {
  id: string;
  milestone_id: string;
  title: string;
  is_completed: boolean;
  display_order: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  category: MilestoneCategory;
  status: MilestoneStatus;
  owner: string | null;
  team: string | null;
  due_date: string | null;
  start_date: string | null;
  progress_type: ProgressType;
  progress_value: number | null;
  metric_key: string | null;
  metric_target: number | null;
  metric_current: number | null;
  metric_unit: string | null;
  dependencies: string[];
  tags: string[] | null;
  display_order: number;
  is_demo: boolean;
  ai_summary: string | null;
  ai_risks: string[] | null;
  created_at: string;
  updated_at: string;
  subtasks?: MilestoneSubtask[];
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  category: MilestoneCategory;
  status?: MilestoneStatus;
  owner?: string;
  due_date?: string;
  progress_type: ProgressType;
  progress_value?: number;
  metric_key?: string;
  metric_target?: number;
  metric_current?: number;
  dependencies?: string[];
  is_demo?: boolean;
}

export interface UpdateMilestoneInput extends Partial<CreateMilestoneInput> {
  id: string;
}

// Available metrics for metric-based milestones
export const AVAILABLE_METRICS = [
  { key: 'creator_count', label: 'Creator Count' },
  { key: 'mrr', label: 'Monthly Recurring Revenue (MRR)' },
  { key: 'identity_verified_users', label: 'Identity Verified Users' },
  { key: 'ad_slots_live', label: 'Live Ad Slots' },
  { key: 'events_created', label: 'Events Created' },
  { key: 'podcast_episodes', label: 'Podcast Episodes' },
  { key: 'active_advertisers', label: 'Active Advertisers' },
];

export const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  product: 'Product',
  engineering: 'Engineering',
  growth: 'Growth',
  fundraising: 'Fundraising',
  ops: 'Operations',
};

export const STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  at_risk: 'At Risk',
  blocked: 'Blocked',
};

export const STATUS_COLORS: Record<MilestoneStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  at_risk: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Calculate effective progress based on progress type
export function calculateProgress(milestone: Milestone): number {
  switch (milestone.progress_type) {
    case 'manual':
      return milestone.progress_value || 0;
    case 'subtask':
      if (!milestone.subtasks || milestone.subtasks.length === 0) return 0;
      const completed = milestone.subtasks.filter(s => s.is_completed).length;
      return Math.round((completed / milestone.subtasks.length) * 100);
    case 'metric':
      if (!milestone.metric_target || milestone.metric_target === 0) return 0;
      const current = milestone.metric_current || 0;
      return Math.min(100, Math.round((current / milestone.metric_target) * 100));
    default:
      return 0;
  }
}

// Determine automatic status based on progress and due date
export function determineAutoStatus(
  milestone: Milestone,
  allMilestones: Milestone[]
): MilestoneStatus {
  const progress = calculateProgress(milestone);
  
  // Check if completed
  if (progress >= 100) {
    return 'completed';
  }
  
  // Check if any dependency is blocked or at_risk
  if (milestone.dependencies && milestone.dependencies.length > 0) {
    const hasBlockedDep = milestone.dependencies.some(depId => {
      const dep = allMilestones.find(m => m.id === depId);
      return dep && (dep.status === 'blocked' || dep.status === 'at_risk');
    });
    if (hasBlockedDep) {
      return 'blocked';
    }
  }
  
  // Check if at risk (due in < 7 days and progress < 50%)
  if (milestone.due_date) {
    const dueDate = new Date(milestone.due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 7 && progress < 50) {
      return 'at_risk';
    }
  }
  
  // If has any progress, it's in progress
  if (progress > 0) {
    return 'in_progress';
  }
  
  return 'not_started';
}

export function useMilestones(includeDemo = true) {
  return useQuery({
    queryKey: ['milestones', includeDemo],
    queryFn: async () => {
      let query = supabase
        .from('milestones')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (!includeDemo) {
        query = query.eq('is_demo', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch subtasks for all milestones
      const milestoneIds = data?.map(m => m.id) || [];
      const { data: subtasks } = await supabase
        .from('milestone_subtasks')
        .select('*')
        .in('milestone_id', milestoneIds)
        .order('display_order', { ascending: true });
      
      // Attach subtasks to milestones
      return (data || []).map(m => ({
        ...m,
        dependencies: m.dependencies || [],
        subtasks: subtasks?.filter(s => s.milestone_id === m.id) || [],
      })) as Milestone[];
    },
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          title: input.title,
          description: input.description || null,
          category: input.category,
          status: input.status || 'not_started',
          owner: input.owner || null,
          due_date: input.due_date || null,
          progress_type: input.progress_type,
          progress_value: input.progress_value || 0,
          metric_key: input.metric_key || null,
          metric_target: input.metric_target || null,
          metric_current: input.metric_current || null,
          dependencies: input.dependencies || [],
          is_demo: input.is_demo || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Milestone created');
    },
    onError: (error) => {
      toast.error('Failed to create milestone: ' + error.message);
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateMilestoneInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Milestone updated');
    },
    onError: (error) => {
      toast.error('Failed to update milestone: ' + error.message);
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Milestone deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete milestone: ' + error.message);
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('milestone_subtasks')
        .update({ is_completed })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ milestone_id, title }: { milestone_id: string; title: string }) => {
      const { error } = await supabase
        .from('milestone_subtasks')
        .insert({ milestone_id, title });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Subtask added');
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('milestone_subtasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success('Subtask removed');
    },
  });
}
