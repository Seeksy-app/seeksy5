import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DecisionStatus = 'open' | 'needs_followup' | 'final' | 'deferred';

export interface BoardDecision {
  id: string;
  meeting_id: string;
  agenda_item_id: string | null;
  topic: string;
  options_json: any;
  recommendation: string | null;
  decision: string | null;
  owner_user_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  // Extended fields we'll store in options_json
  option_summary?: string;
  upside?: string;
  risk?: string;
  status?: DecisionStatus;
  owner_name?: string;
}

export interface CreateDecisionInput {
  meeting_id: string;
  topic: string;
  option_summary?: string;
  upside?: string;
  risk?: string;
  decision?: string;
  owner_name?: string;
  due_date?: string;
}

export interface UpdateDecisionInput {
  id: string;
  topic?: string;
  option_summary?: string;
  upside?: string;
  risk?: string;
  decision?: string;
  status?: DecisionStatus;
  owner_name?: string;
  due_date?: string;
}

const PLATFORM_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export function useBoardDecisions(meetingId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ["board-decisions", meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      const result = await (supabase as any)
        .from("board_decisions")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true });
      if (result.error) throw result.error;
      // Parse options_json for extended fields
      return ((result.data as any[]) || []).map((d: any) => ({
        ...d,
        option_summary: d.options_json?.option_summary || '',
        upside: d.options_json?.upside || '',
        risk: d.options_json?.risk || '',
        status: d.options_json?.status || 'open',
        owner_name: d.options_json?.owner_name || '',
      })) as BoardDecision[];
    },
    enabled: !!meetingId,
  });

  const createDecision = useMutation({
    mutationFn: async (input: CreateDecisionInput) => {
      const optionsJson = {
        option_summary: input.option_summary || '',
        upside: input.upside || '',
        risk: input.risk || '',
        status: 'open',
        owner_name: input.owner_name || '',
      };
      const result = await (supabase as any)
        .from("board_decisions")
        .insert({
          meeting_id: input.meeting_id,
          tenant_id: PLATFORM_TENANT_ID,
          topic: input.topic,
          options_json: optionsJson,
          decision: input.decision || null,
          due_date: input.due_date || null,
        })
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-decisions", meetingId] });
      toast.success("Decision added");
    },
    onError: (error) => {
      console.error("Failed to create decision:", error);
      toast.error("Failed to add decision");
    },
  });

  const updateDecision = useMutation({
    mutationFn: async (input: UpdateDecisionInput) => {
      // First get current record to merge options_json
      const currentResult = await (supabase as any)
        .from("board_decisions")
        .select("options_json")
        .eq("id", input.id)
        .single();
      
      const currentOptions = (currentResult.data?.options_json as any) || {};
      const updatedOptions = { ...currentOptions };
      
      if (input.option_summary !== undefined) updatedOptions.option_summary = input.option_summary;
      if (input.upside !== undefined) updatedOptions.upside = input.upside;
      if (input.risk !== undefined) updatedOptions.risk = input.risk;
      if (input.status !== undefined) updatedOptions.status = input.status;
      if (input.owner_name !== undefined) updatedOptions.owner_name = input.owner_name;

      const updateData: any = { options_json: updatedOptions };
      if (input.topic !== undefined) updateData.topic = input.topic;
      if (input.decision !== undefined) updateData.decision = input.decision;
      if (input.due_date !== undefined) updateData.due_date = input.due_date;

      const result = await (supabase as any)
        .from("board_decisions")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-decisions", meetingId] });
    },
    onError: (error) => {
      console.error("Failed to update decision:", error);
      toast.error("Failed to update decision");
    },
  });

  const deleteDecision = useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any).from("board_decisions").delete().eq("id", id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-decisions", meetingId] });
      toast.success("Decision removed");
    },
    onError: (error) => {
      console.error("Failed to delete decision:", error);
      toast.error("Failed to delete decision");
    },
  });

  const deferAllUnresolved = useMutation({
    mutationFn: async (note?: string) => {
      const unresolved = decisions.filter(d => 
        d.status === 'open' || d.status === 'needs_followup' || !d.decision?.trim()
      );
      for (const dec of unresolved) {
        const currentOptions = (dec.options_json as any) || {};
        await (supabase as any)
          .from("board_decisions")
          .update({
            options_json: { ...currentOptions, status: 'deferred', deferred_note: note },
          })
          .eq("id", dec.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-decisions", meetingId] });
      toast.success("All unresolved decisions deferred");
    },
  });

  const unresolvedDecisions = decisions.filter(d => 
    d.status === 'open' || d.status === 'needs_followup' || !d.decision?.trim()
  );

  const hasUnresolvedDecisions = unresolvedDecisions.length > 0;

  return {
    decisions,
    isLoading,
    createDecision,
    updateDecision,
    deleteDecision,
    deferAllUnresolved,
    unresolvedDecisions,
    hasUnresolvedDecisions,
  };
}
