import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

interface ClaimsNote {
  category: string;
  value: string;
}

interface IntakeData {
  status: string;
  branch: string;
  claimStatus: string;
  primaryGoals: string[];
}

interface VeteranProfile {
  id: string;
  service_status: string | null;
  branch_of_service: string | null;
  has_intent_to_file: boolean | null;
  has_active_claim: boolean | null;
  last_claim_stage: string | null;
}

export function useVeteranConversation(user: User | null, conversationIdParam: string | null, isNew: boolean) {
  const [conversationId, setConversationId] = useState<string | null>(conversationIdParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<ClaimsNote[]>([]);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profile, setProfile] = useState<VeteranProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [intakeComplete, setIntakeComplete] = useState(false);

  // Load user's veteran profile
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      const result = await (supabase as any)
        .from('veteran_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const data = result.data as VeteranProfile | null;
      if (data) {
        setProfile(data);
        if (data.service_status && data.branch_of_service) {
          setIntakeData({
            status: data.service_status,
            branch: data.branch_of_service,
            claimStatus: data.last_claim_stage || 'learning',
            primaryGoals: ['understand_benefits'],
          });
        }
      }
    };

    loadProfile();
  }, [user]);

  // Load existing conversation or create new one
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadOrCreateConversation = async () => {
      setIsLoading(true);

      if (isNew) {
        setConversationId(null);
        setMessages([]);
        setNotes([]);
        setIntakeComplete(false);
        setIsLoading(false);
        return;
      }

      if (conversationIdParam) {
        await loadConversation(conversationIdParam);
        return;
      }

      const recentResult = await (supabase as any)
        .from('veteran_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      const recentConvo = recentResult.data as { id: string } | null;

      if (recentConvo) {
        await loadConversation(recentConvo.id);
      } else {
        setIsLoading(false);
      }
    };

    loadOrCreateConversation();
  }, [user, conversationIdParam, isNew]);

  const loadConversation = async (id: string) => {
    try {
      const convoResult = await (supabase as any)
        .from('veteran_conversations')
        .select('*')
        .eq('id', id)
        .single();

      const convo = convoResult.data as any;

      if (!convo) {
        setIsLoading(false);
        return;
      }

      setConversationId(id);

      if (convo.context_json && typeof convo.context_json === 'object') {
        const context = convo.context_json as Record<string, unknown>;
        if (context.intakeData) {
          setIntakeData(context.intakeData as IntakeData);
          setIntakeComplete(true);
        }
        if (context.userName) {
          setUserName(context.userName as string);
        }
        if (context.notes && Array.isArray(context.notes)) {
          setNotes(context.notes as ClaimsNote[]);
        }
      }

      const messagesResult = await (supabase as any)
        .from('veteran_chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      const chatMessages = messagesResult.data as any[] | null;

      if (chatMessages && chatMessages.length > 0) {
        const loadedMessages: Message[] = chatMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          quickReplies: Array.isArray(m.quick_replies) ? m.quick_replies as string[] : undefined,
        }));
        setMessages(loadedMessages);
        setIntakeComplete(true);

        const allNotes: ClaimsNote[] = [];
        chatMessages.forEach(m => {
          if (m.notes && Array.isArray(m.notes)) {
            (m.notes as unknown as ClaimsNote[]).forEach(n => {
              if (n && typeof n === 'object' && 'category' in n && 'value' in n) {
                if (!allNotes.some(existing => existing.category === n.category && existing.value === n.value)) {
                  allNotes.push({ category: String(n.category), value: String(n.value) });
                }
              }
            });
          }
        });
        if (allNotes.length > 0) setNotes(allNotes);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = useCallback(async (intake: IntakeData): Promise<string | null> => {
    if (!user) return null;

    try {
      const contextJson = {
        intakeData: {
          status: intake.status,
          branch: intake.branch,
          claimStatus: intake.claimStatus,
          primaryGoals: intake.primaryGoals,
        }
      };

      const result = await (supabase as any)
        .from('veteran_conversations')
        .insert({
          user_id: user.id,
          title: 'Claims Discussion',
          context_json: contextJson,
        })
        .select()
        .single();

      if (result.error) throw result.error;
      const data = result.data as any;

      setConversationId(data.id);
      setIntakeData(intake);

      await (supabase as any).from('veteran_profiles').upsert({
        user_id: user.id,
        service_status: intake.status,
        branch_of_service: intake.branch,
        last_claim_stage: intake.claimStatus,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user]);

  const saveMessage = useCallback(async (
    message: Message, 
    currentNotes?: ClaimsNote[]
  ) => {
    if (!user || !conversationId) return;

    try {
      const notesJson = currentNotes ? currentNotes.map(n => ({ category: n.category, value: n.value })) : null;
      const quickRepliesJson = message.quickReplies || null;

      await (supabase as any).from('veteran_chat_messages').insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        quick_replies: quickRepliesJson,
        notes: notesJson,
      });

      const contextJson = {
        intakeData: intakeData ? {
          status: intakeData.status,
          branch: intakeData.branch,
          claimStatus: intakeData.claimStatus,
          primaryGoals: intakeData.primaryGoals,
        } : null,
        userName: userName,
        notes: (currentNotes || notes).map(n => ({ category: n.category, value: n.value })),
      };

      await (supabase as any)
        .from('veteran_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          context_json: contextJson,
          title: userName ? `Chat with ${userName}` : 'Claims Discussion',
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [user, conversationId, intakeData, userName, notes]);

  const updateContext = useCallback(async (updates: Partial<{
    userName: string;
    notes: ClaimsNote[];
    intakeData: IntakeData;
  }>) => {
    if (updates.userName) setUserName(updates.userName);
    if (updates.notes) setNotes(updates.notes);
    if (updates.intakeData) setIntakeData(updates.intakeData);

    if (!user || !conversationId) return;

    try {
      const finalIntake = updates.intakeData || intakeData;
      const finalNotes = updates.notes || notes;
      const finalUserName = updates.userName || userName;

      const contextJson = {
        intakeData: finalIntake ? {
          status: finalIntake.status,
          branch: finalIntake.branch,
          claimStatus: finalIntake.claimStatus,
          primaryGoals: finalIntake.primaryGoals,
        } : null,
        userName: finalUserName,
        notes: finalNotes.map(n => ({ category: n.category, value: n.value })),
      };

      await (supabase as any)
        .from('veteran_conversations')
        .update({
          context_json: contextJson,
          title: finalUserName ? `Chat with ${finalUserName}` : 'Claims Discussion',
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }, [user, conversationId, intakeData, userName, notes]);

  return {
    conversationId,
    messages,
    setMessages,
    notes,
    setNotes,
    intakeData,
    setIntakeData,
    userName,
    setUserName,
    profile,
    isLoading,
    intakeComplete,
    setIntakeComplete,
    createConversation,
    saveMessage,
    updateContext,
  };
}
