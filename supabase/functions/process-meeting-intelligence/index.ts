import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🔒 Meeting Intelligence: Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.log("🔒 Meeting Intelligence: Invalid token -", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const roles = userRoles?.map(r => r.role) || [];
    const isAdmin = roles.some(r => ["admin", "super_admin"].includes(r));

    const { meetingId, transcript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!meetingId || !transcript) {
      throw new Error('Meeting ID and transcript are required');
    }

    // === AUTHORIZATION ===
    // Verify the user owns the meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('user_id')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      console.log(`🔒 Meeting Intelligence: Meeting ${meetingId} not found`);
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin && meeting.user_id !== user.id) {
      console.log(`🔒 Meeting Intelligence: User ${user.id} denied access to meeting ${meetingId} owned by ${meeting.user_id}`);
      return new Response(
        JSON.stringify({ error: "Access denied. You can only process intelligence for your own meetings." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Meeting Intelligence: Authorized - user=${user.id}, roles=[${roles.join(',')}], meeting=${meetingId}`);

    // Call Lovable AI to analyze the meeting transcript
    const systemPrompt = `You are an AI meeting assistant. Analyze the provided meeting transcript and extract:
1. A concise summary (2-3 sentences)
2. Key takeaways (3-5 bullet points)
3. Action items with assignees if mentioned
4. Important decisions made

Format your response as JSON with this structure:
{
  "summary": "Brief meeting summary",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "actionItems": [
    {
      "task": "Description of task",
      "assignee": "Person name or 'Unassigned'",
      "priority": "high|medium|low"
    }
  ],
  "decisions": ["decision1", "decision2"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this meeting transcript:\n\n${transcript}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_meeting_intelligence",
              description: "Extract structured meeting intelligence from transcript",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  keyTakeaways: {
                    type: "array",
                    items: { type: "string" }
                  },
                  actionItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task: { type: "string" },
                        assignee: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["task", "assignee", "priority"]
                    }
                  },
                  decisions: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["summary", "keyTakeaways", "actionItems", "decisions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_meeting_intelligence" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const intelligence = JSON.parse(toolCall.function.arguments);

    // Store in database
    const { data: intelligenceData, error: insertError } = await supabase
      .from('meeting_intelligence')
      .upsert({
        meeting_id: meetingId,
        transcript: transcript,
        summary: intelligence.summary,
        key_takeaways: intelligence.keyTakeaways,
        action_items: intelligence.actionItems,
        decisions: intelligence.decisions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'meeting_id'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      throw insertError;
    }

    console.log('Meeting intelligence saved successfully');

    return new Response(JSON.stringify({
      success: true,
      intelligence: intelligenceData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-meeting-intelligence:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
