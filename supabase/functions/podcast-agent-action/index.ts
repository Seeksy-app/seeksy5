import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ActionRequest {
  actionType: string;
  actionData: any;
  workspaceId?: string;
  conversationId?: string;
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
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { actionType, actionData, workspaceId, conversationId }: ActionRequest = await req.json();

    let result: any = { success: true };

    switch (actionType) {
      case "outreach": {
        // Create or get workspace
        let wsId = workspaceId;
        if (!wsId) {
          const { data: workspace } = await supabase
            .from("podcast_episode_workspaces")
            .insert({
              user_id: user.id,
              title: `Episode with ${actionData.guestName}`,
              topic: actionData.topic || null,
            })
            .select()
            .single();
          wsId = workspace?.id;
        }

        // Save outreach record
        const { data: outreach, error: outreachError } = await supabase
          .from("podcast_guest_outreach")
          .insert({
            workspace_id: wsId,
            guest_email: actionData.guestEmail,
            guest_name: actionData.guestName,
            email_subject: actionData.emailSubject,
            email_body: actionData.emailBody,
            meeting_link: actionData.meetingLink,
            status: "draft",
          })
          .select()
          .single();

        if (outreachError) {
          throw new Error(`Failed to save outreach: ${outreachError.message}`);
        }

        // Update workspace status
        if (wsId) {
          await supabase
            .from("podcast_episode_workspaces")
            .update({ guest_invited: true })
            .eq("id", wsId);
        }

        result = { 
          success: true, 
          outreachId: outreach.id, 
          workspaceId: wsId,
          message: "Outreach email saved as draft. Ready to send when you approve." 
        };
        break;
      }

      case "send_email": {
        // Use fetch to call Resend API directly
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) {
          throw new Error("Email sending not configured");
        }

        // Get user profile for sender info
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", user.id)
          .single();

        const senderName = profile?.full_name || profile?.username || "Podcast Host";

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${senderName} <onboarding@resend.dev>`,
            to: [actionData.guestEmail],
            subject: actionData.emailSubject,
            html: actionData.emailBody.replace(/\n/g, "<br>"),
          }),
        });

        const emailData = await emailResponse.json();

        // Update outreach status
        if (actionData.outreachId) {
          await supabase
            .from("podcast_guest_outreach")
            .update({ 
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", actionData.outreachId);
        }

        result = { 
          success: true, 
          emailId: emailData.id,
          message: `Email sent successfully to ${actionData.guestEmail}` 
        };
        break;
      }

      case "research": {
        let wsId = workspaceId;
        if (!wsId) {
          const { data: workspace } = await supabase
            .from("podcast_episode_workspaces")
            .insert({
              user_id: user.id,
              title: `Episode with ${actionData.guestName}`,
              topic: actionData.topic || null,
            })
            .select()
            .single();
          wsId = workspace?.id;
        }

        const { data: research, error: researchError } = await supabase
          .from("podcast_guest_research")
          .insert({
            workspace_id: wsId,
            guest_name: actionData.guestName,
            guest_title: actionData.guestTitle,
            guest_company: actionData.guestCompany,
            background_summary: actionData.backgroundSummary,
            suggested_questions: actionData.questions || [],
            talking_points: actionData.talkingPoints || [],
            topic_breakdowns: actionData.topicBreakdowns || [],
            potential_soundbites: actionData.potentialSoundbites || [],
          })
          .select()
          .single();

        if (researchError) {
          throw new Error(`Failed to save research: ${researchError.message}`);
        }

        // Update workspace status
        if (wsId) {
          await supabase
            .from("podcast_episode_workspaces")
            .update({ research_complete: true })
            .eq("id", wsId);
        }

        result = { 
          success: true, 
          researchId: research.id, 
          workspaceId: wsId,
          message: "Research saved to episode workspace." 
        };
        break;
      }

      case "outline": {
        let wsId = workspaceId;
        if (!wsId) {
          const { data: workspace } = await supabase
            .from("podcast_episode_workspaces")
            .insert({
              user_id: user.id,
              title: actionData.titleSuggestions?.[0] || "New Episode",
              topic: actionData.topic || null,
            })
            .select()
            .single();
          wsId = workspace?.id;
        }

        const { data: outline, error: outlineError } = await supabase
          .from("podcast_episode_outlines")
          .insert({
            workspace_id: wsId,
            title_suggestions: actionData.titleSuggestions || [],
            intro_script: actionData.introScript,
            outro_script: actionData.outroScript,
            sections: actionData.sections || [],
            guest_bio_paragraph: actionData.guestBio,
            cta_recommendations: actionData.ctaRecommendations || [],
            estimated_duration_minutes: actionData.estimatedDuration,
          })
          .select()
          .single();

        if (outlineError) {
          throw new Error(`Failed to save outline: ${outlineError.message}`);
        }

        // Update workspace status
        if (wsId) {
          await supabase
            .from("podcast_episode_workspaces")
            .update({ outline_complete: true })
            .eq("id", wsId);
        }

        result = { 
          success: true, 
          outlineId: outline.id, 
          workspaceId: wsId,
          message: "Episode outline saved." 
        };
        break;
      }

      case "task": {
        // Create agent task
        const { data: agentTask, error: taskError } = await supabase
          .from("podcast_agent_tasks")
          .insert({
            workspace_id: workspaceId,
            user_id: user.id,
            title: actionData.title,
            description: actionData.description,
            task_type: actionData.taskType || "prep",
            due_date: actionData.dueDate,
            priority: actionData.priority || "medium",
          })
          .select()
          .single();

        if (taskError) {
          throw new Error(`Failed to create task: ${taskError.message}`);
        }

        // Also create in main tasks table for My Day integration
        const { data: mainTask } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            title: actionData.title,
            description: actionData.description,
            priority: actionData.priority || "medium",
            due_date: actionData.dueDate,
            status: "todo",
          })
          .select()
          .single();

        // Link the tasks
        if (mainTask) {
          await supabase
            .from("podcast_agent_tasks")
            .update({ linked_task_id: mainTask.id })
            .eq("id", agentTask.id);
        }

        result = { 
          success: true, 
          taskId: agentTask.id,
          message: `Task created: "${actionData.title}"` 
        };
        break;
      }

      default:
        result = { success: false, error: `Unknown action type: ${actionType}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Action execution error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
