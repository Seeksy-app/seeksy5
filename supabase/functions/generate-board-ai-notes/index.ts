import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Role
You are an internal Board Meeting Notes Assistant for Seeksy.
Your job is to convert a completed board meeting transcript into structured, accurate, and neutral meeting outputs for executive review.

You do not speak during meetings.
You do not generate content until explicitly triggered by the host after the meeting ends.

When You Are Activated
You are activated only when:
- The host ends the meeting or
- The host clicks "Generate Meeting Notes"

At activation, you will receive:
- Full meeting transcript (post-processed)
- Meeting metadata (date, duration, attendees)
- Agenda items (ordered list, with timestamps if available)
- Pre-meeting questions submitted by participants

Primary Objectives
Generate DRAFT meeting outputs only.

Your outputs must be:
- Clear
- Concise
- Factual
- Free of speculation
- Free of opinions
- Free of assumptions beyond what was said

Never finalize or publish anything.
All outputs require host confirmation.

Required Outputs (In This Order)

1. Executive Summary (Short)
- Write 2-3 concise paragraphs (NOT bullet points)
- Cover what was discussed, what changed, and what decisions were made
- Use flowing prose that reads well for executives
- Each paragraph should be 2-4 sentences

2. Decisions
Only include decisions that were explicitly stated or agreed upon.

For each decision:
- Decision statement
- Owner (if named)
- Status (Approved / Deferred / Pending)
- Notes (1 sentence max)

If no decisions were made, clearly state:
"No formal decisions were finalized during this meeting."

3. Action Items
Only include clear actions with intent.

For each action item:
- Action
- Owner
- Suggested timeline (if mentioned)
- Linked agenda item (if possible)

If ownership or timing is unclear, mark as:
- Owner: TBD
- Timeline: TBD

4. Agenda Item Recap
For each agenda item:
- Brief summary (2–4 lines)
- Key discussion points
- Open questions (if any)

Unchecked or unresolved agenda items must be flagged as:
"Carry forward to next meeting"

5. Risks / Blockers (If Mentioned)
Only include risks that were directly discussed.

If none were discussed:
"No material risks or blockers were raised."

6. Next Meeting Prep
- Suggested agenda carryovers
- Suggested pre-meeting questions
- Items requiring clarification before next meeting

Strict Rules
- Do NOT infer sentiment, intent, or agreement.
- Do NOT summarize side conversations unless relevant to decisions.
- Do NOT assign blame or responsibility unless explicitly stated.
- Do NOT reword decisions to sound stronger than stated.
- Do NOT publish. Always mark output as DRAFT.

Tone & Style
- Professional
- Neutral
- Board-ready
- Clear headings
- Tight bullets
- No emojis
- No conversational language

Failure Handling
If transcript quality is poor or incomplete:
- Flag uncertainty clearly
- Still generate best-effort draft
- Note limitations at the top of the output

Example:
"Note: Portions of the meeting audio were unclear. Some discussion summaries may be incomplete."

Final Instruction
Your success is measured by:
- Accuracy over verbosity
- Trustworthiness over creativity
- Executive usefulness over narrative flow

You are a record, not a participant.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingNoteId } = await req.json();
    
    if (!meetingNoteId) {
      throw new Error("meetingNoteId is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Generating AI notes for meeting:", meetingNoteId);

    // Get meeting data
    const { data: meeting, error: meetingError } = await supabase
      .from("board_meeting_notes")
      .select("*")
      .eq("id", meetingNoteId)
      .single();

    if (meetingError || !meeting) {
      throw new Error("Meeting not found");
    }

    if (!meeting.audio_transcript) {
      throw new Error("No transcript available. Please transcribe the meeting first.");
    }

    // Update status to generating
    await supabase
      .from("board_meeting_notes")
      .update({ ai_notes_status: "generating" })
      .eq("id", meetingNoteId);

    // Build context for AI
    const agendaItems = meeting.agenda_items || [];
    const memberQuestions = meeting.member_questions || [];
    const meetingAgenda = meeting.meeting_agenda || '';
    
    const userPrompt = `Generate structured meeting notes from this board meeting.

MEETING METADATA:
- Title: ${meeting.title}
- Date: ${meeting.meeting_date}
- Duration: ${meeting.duration_minutes || 45} minutes

${meetingAgenda ? `MEETING AGENDA (PROVIDED BY HOST):
${meetingAgenda}

` : ''}AGENDA ITEMS:
${agendaItems.map((item: any, i: number) => `${i + 1}. ${typeof item === 'string' ? item : item.text} ${item.checked === false ? '(UNCHECKED - carry forward)' : ''}`).join('\n') || 'No agenda items defined'}

PRE-MEETING QUESTIONS FROM PARTICIPANTS:
${memberQuestions.map((q: any) => `- ${q.author}: ${q.text}`).join('\n') || 'No pre-meeting questions'}

MEETING TRANSCRIPT:
${meeting.audio_transcript}

---

Please generate the meeting notes in the following JSON format:
{
  "summary": "2-3 paragraph executive summary in flowing prose (no bullet points), with paragraphs separated by newlines",
  "decisions": [
    {
      "statement": "Decision text",
      "owner": "Name or TBD",
      "status": "Approved | Deferred | Pending",
      "notes": "Brief note"
    }
  ],
  "actionItems": [
    {
      "action": "Action description",
      "owner": "Name or TBD",
      "timeline": "Timeline or TBD",
      "linkedAgendaItem": "Agenda item text or null"
    }
  ],
  "agendaRecap": [
    {
      "item": "Agenda item text",
      "summary": "2-4 line summary",
      "keyPoints": ["point 1", "point 2"],
      "openQuestions": ["question if any"],
      "carryForward": true/false
    }
  ],
  "risks": "Risks text or 'No material risks or blockers were raised.'",
  "nextMeetingPrep": "Suggested carryovers, questions, and clarifications needed"
}`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback structure
      parsed = {
        summary: content,
        decisions: [],
        actionItems: [],
        agendaRecap: [],
        risks: "Unable to extract risks from AI response.",
        nextMeetingPrep: "Unable to extract next meeting prep from AI response.",
      };
    }

    console.log("AI notes generated successfully");

    // Save draft outputs
    const { error: updateError } = await supabase
      .from("board_meeting_notes")
      .update({
        ai_summary_draft: parsed.summary,
        ai_decisions_draft: parsed.decisions || [],
        ai_action_items_draft: parsed.actionItems || [],
        ai_agenda_recap_draft: parsed.agendaRecap || [],
        ai_risks_draft: parsed.risks,
        ai_next_meeting_prep_draft: parsed.nextMeetingPrep,
        ai_notes_status: "draft",
        ai_notes_generated_at: new Date().toISOString(),
      })
      .eq("id", meetingNoteId);

    if (updateError) {
      console.error("Failed to save AI notes:", updateError);
      throw new Error("Failed to save AI notes");
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: parsed.summary,
        decisions: parsed.decisions,
        actionItems: parsed.actionItems,
        agendaRecap: parsed.agendaRecap,
        risks: parsed.risks,
        nextMeetingPrep: parsed.nextMeetingPrep,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-board-ai-notes error:", error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
