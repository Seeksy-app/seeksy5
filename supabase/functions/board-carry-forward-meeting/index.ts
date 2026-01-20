import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { completed_meeting_id } = await req.json();

    if (!completed_meeting_id) {
      return new Response(
        JSON.stringify({ error: 'completed_meeting_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating carry-forward meeting from:', completed_meeting_id);

    // Check for existing follow-up (idempotency)
    const { data: existingFollowUp } = await supabaseClient
      .from('board_meeting_notes')
      .select('id')
      .eq('carry_forward_source_id', completed_meeting_id)
      .maybeSingle();

    if (existingFollowUp) {
      console.log('Follow-up already exists:', existingFollowUp.id);
      return new Response(
        JSON.stringify({
          success: true,
          new_meeting_id: existingFollowUp.id,
          carried_agenda_items: 0,
          carried_decisions: 0,
          already_existed: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the completed meeting
    const { data: completedMeeting, error: fetchError } = await supabaseClient
      .from('board_meeting_notes')
      .select('*')
      .eq('id', completed_meeting_id)
      .single();

    if (fetchError || !completedMeeting) {
      console.error('Error fetching meeting:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get deferred decisions (status stored in options_json)
    const { data: allDecisions, error: decisionsError } = await supabaseClient
      .from('board_decisions')
      .select('*')
      .eq('meeting_id', completed_meeting_id);

    if (decisionsError) {
      console.error('Error fetching decisions:', decisionsError);
    }

    // Filter for deferred decisions (status is in options_json)
    const deferredDecisions = (allDecisions || []).filter((d: any) => 
      d.options_json?.status === 'deferred'
    );

    // Get unchecked agenda items
    const agendaItems = completedMeeting.agenda_items || [];
    const uncheckedItems = Array.isArray(agendaItems) 
      ? agendaItems.filter((item: any) => !item.checked)
      : [];

    console.log('Unchecked agenda items:', uncheckedItems.length);
    console.log('Deferred decisions:', deferredDecisions.length);

    // Calculate next meeting date (7 days from completed meeting)
    const originalDate = new Date(completedMeeting.meeting_date + 'T12:00:00');
    const nextDate = new Date(originalDate);
    nextDate.setDate(nextDate.getDate() + 7);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Build carried agenda items with context
    const carriedAgendaItems = uncheckedItems.map((item: any) => ({
      text: typeof item === 'string' ? item : item.text,
      checked: false,
      carried_from: completed_meeting_id,
    }));

    // Add deferred decisions as agenda items
    deferredDecisions.forEach((d: any) => {
      carriedAgendaItems.push({
        text: `[Deferred Decision] ${d.topic}`,
        checked: false,
        carried_from: completed_meeting_id,
      });
    });

    // Build summary from previous meeting
    const previousSummary = completedMeeting.memo?.purpose || '';
    const carryForwardMemo = {
      purpose: previousSummary ? `Follow-up from: ${completedMeeting.title}\n\nPrevious Summary: ${previousSummary}` : `Follow-up from: ${completedMeeting.title}`,
      objective: 'Review carried items and deferred decisions from previous meeting',
      current_state: [
        `${uncheckedItems.length} unchecked agenda items carried forward`,
        `${deferredDecisions.length} deferred decisions to review`,
      ],
      key_questions: deferredDecisions.map((d: any) => `Decision needed: ${d.topic}`),
    };

    // Create new meeting draft with summary carried forward
    const newMeeting = {
      title: `Follow-up: ${completedMeeting.title}`,
      meeting_date: nextDateStr,
      start_time: completedMeeting.start_time,
      duration_minutes: completedMeeting.duration_minutes,
      agenda_items: carriedAgendaItems,
      memo: carryForwardMemo,
      decision_table: [],
      member_questions: [],
      status: 'upcoming',
      created_by: completedMeeting.created_by,
      host_user_id: completedMeeting.host_user_id,
      carry_forward_source_id: completed_meeting_id,
    };

    const { data: newMeetingData, error: insertError } = await supabaseClient
      .from('board_meeting_notes')
      .insert(newMeeting)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating meeting:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create meeting' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created new meeting:', newMeetingData.id);

    // Copy deferred decisions to new meeting with proper structure
    if (deferredDecisions.length > 0) {
      const PLATFORM_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';
      
      const newDecisions = deferredDecisions.map((d: any) => ({
        meeting_id: newMeetingData.id,
        tenant_id: d.tenant_id || PLATFORM_TENANT_ID,
        topic: d.topic,
        decision: d.decision,
        due_date: d.due_date,
        options_json: {
          ...d.options_json,
          status: 'open', // Reset to open for review
          carried_from_meeting: completed_meeting_id,
        },
        carried_from_meeting_id: completed_meeting_id,
      }));

      const { error: decisionsInsertError } = await supabaseClient
        .from('board_decisions')
        .insert(newDecisions);

      if (decisionsInsertError) {
        console.error('Error copying decisions:', decisionsInsertError);
      } else {
        console.log('Copied', newDecisions.length, 'deferred decisions');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_meeting_id: newMeetingData.id,
        carried_agenda_items: carriedAgendaItems.length,
        carried_decisions: deferredDecisions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in board-carry-forward-meeting:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});