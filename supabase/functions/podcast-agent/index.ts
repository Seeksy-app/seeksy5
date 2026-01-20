import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AgentRequest {
  message: string;
  conversationId?: string;
  workspaceId?: string;
  context?: {
    podcastId?: string;
    episodeId?: string;
  };
}

const SYSTEM_PROMPT = `You are an AI Podcast Production Agent for Seeksy. You help podcasters prepare episodes efficiently.

RESPONSE RULES:
- Keep responses to 1-2 short sentences maximum
- NEVER use markdown formatting (no **, no #, no *)
- Be direct and action-oriented
- If you have enough info, DO the action - don't ask for more details
- Only ask ONE clarifying question if absolutely necessary

You can help with:
1. GUEST OUTREACH: Invite guests, send emails, manage scheduling
2. RESEARCH: Generate interview questions, talking points
3. OUTLINES: Create episode structures
4. TASKS: Create preparation tasks
5. SCHEDULING: Coordinate meeting times

SMART BEHAVIOR:
- If user mentions a name, check the contacts list first
- If user mentions a meeting type, check available meeting types
- If you find a match, proceed with the action
- If multiple matches exist, pick the best one and proceed

When the user makes a request, return a JSON response:
{
  "response": "Brief confirmation of what you're doing (1-2 sentences, no markdown)",
  "actions": [
    {
      "type": "outreach|research|outline|task|schedule|follow_up",
      "title": "Action title",
      "description": "What this action does",
      "data": { ... action-specific data ... },
      "requiresApproval": true/false
    }
  ],
  "suggestedFollowUps": ["Follow-up 1", "Follow-up 2"]
}

For OUTREACH: include guestName, guestEmail, emailSubject, emailBody, meetingLink
For RESEARCH: include guestName, topic, questions array, talkingPoints array
For OUTLINE: include titleSuggestions, introScript, outroScript, sections array
For TASK: include title, description, dueDate, priority, taskType

MISSING MEETING TYPE HANDLING:
If the user asks to send an invite using a meeting type that doesn't exist in the meeting types list, include a special action:
{
  "type": "create_meeting_type",
  "title": "Create Meeting Type",
  "description": "No matching meeting type found. Would you like to create one?",
  "data": {
    "suggestedName": "Pre-Podcast Interview",
    "suggestedDuration": 30
  },
  "requiresApproval": true
}

Be proactive - if you have what you need, create the action and show it for approval.`;

async function getContactByName(supabase: any, userId: string, name: string) {
  const searchName = name.toLowerCase();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", `%${searchName}%`)
    .limit(5);
  
  return contacts?.[0] || null;
}

async function getMeetingTypes(supabase: any, userId: string) {
  const { data: meetingTypes } = await supabase
    .from("meeting_types")
    .select("*")
    .eq("user_id", userId)
    .limit(10);
  
  return meetingTypes || [];
}

async function getUserPodcasts(supabase: any, userId: string) {
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .eq("user_id", userId)
    .limit(10);
  
  return podcasts || [];
}

async function getConversationHistory(supabase: any, conversationId: string) {
  const { data: messages } = await supabase
    .from("podcast_agent_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);
  
  return messages || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, conversationId, workspaceId, context }: AgentRequest = await req.json();

    // Get context data
    const [contacts, meetingTypes, podcasts, conversationHistory] = await Promise.all([
      message.match(/invite|email|contact|guest/i) ? 
        supabase.from("contacts").select("id, name, email, company").eq("user_id", user.id).limit(50).then(r => r.data) : 
        [],
      getMeetingTypes(supabase, user.id),
      getUserPodcasts(supabase, user.id),
      conversationId ? getConversationHistory(supabase, conversationId) : [],
    ]);

    // Extract guest name if mentioned
    const guestMatch = message.match(/invite\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    let guestContext = "";
    if (guestMatch) {
      const guestName = guestMatch[1];
      const contact = await getContactByName(supabase, user.id, guestName);
      if (contact) {
        guestContext = `\n\nFound contact matching "${guestName}": ${JSON.stringify(contact)}`;
      } else {
        guestContext = `\n\nNo contact found matching "${guestName}". Available contacts: ${JSON.stringify(contacts?.slice(0, 10))}`;
      }
    }

    // Build context for AI
    const contextInfo = `
User's available data:
- Contacts: ${contacts?.length || 0} contacts available
- Meeting types: ${meetingTypes.map((m: any) => `${m.name} (${m.duration} min)`).join(", ") || "None configured"}
- Podcasts: ${podcasts.map((p: any) => p.title).join(", ") || "None"}
${guestContext}

${conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n")}` : ""}
`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextInfo },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No response from AI");
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          response: aiContent,
          actions: [],
          suggestedFollowUps: [],
        };
      }
    } catch {
      parsedResponse = {
        response: aiContent,
        actions: [],
        suggestedFollowUps: [],
      };
    }

    // Create or get conversation
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("podcast_agent_conversations")
        .insert({
          user_id: user.id,
          podcast_id: context?.podcastId,
          episode_id: context?.episodeId,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        })
        .select()
        .single();
      
      if (convError) {
        console.error("Failed to create conversation:", convError);
      } else {
        activeConversationId = newConv.id;
      }
    }

    // Save messages
    if (activeConversationId) {
      await supabase.from("podcast_agent_messages").insert([
        {
          conversation_id: activeConversationId,
          role: "user",
          content: message,
        },
        {
          conversation_id: activeConversationId,
          role: "assistant",
          content: parsedResponse.response,
          action_type: parsedResponse.actions?.[0]?.type || null,
          action_data: parsedResponse.actions?.length > 0 ? parsedResponse.actions : null,
        },
      ]);
    }

    return new Response(JSON.stringify({
      conversationId: activeConversationId,
      ...parsedResponse,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Podcast agent error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
