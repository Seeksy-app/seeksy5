import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Calling Lovable AI with messages:", messages.length, "userId:", userId);

    // Check if user is admin
    let isAdmin = false;
    if (userId) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();
      
      isAdmin = !!userRoles;
      console.log("User is admin:", isAdmin);
    }

    // Get relevant knowledge base entries based on the last user message
    let knowledgeContext = "";
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
    
    if (lastUserMessage?.content) {
      const query = lastUserMessage.content.toLowerCase();
      
      // Search knowledge base with simple keyword matching
      const { data: kbEntries } = await supabase
        .from("ai_knowledge_base")
        .select("title, content, category")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(5);
      
      if (kbEntries && kbEntries.length > 0) {
        // Score and filter entries based on query relevance
        const scoredEntries = kbEntries
          .map(entry => {
            let score = 0;
            const searchText = `${entry.title} ${entry.content} ${entry.category}`.toLowerCase();
            const queryWords = query.split(/\s+/).filter((w: string) => w.length > 2);
            
            for (const word of queryWords) {
              if (searchText.includes(word)) score += 1;
            }
            return { ...entry, score };
          })
          .filter(e => e.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        
        if (scoredEntries.length > 0) {
          knowledgeContext = "\n\n**Seeksy Platform Knowledge:**\n" + 
            scoredEntries.map(e => `- **${e.title}**: ${e.content}`).join("\n");
          console.log("Added KB context with", scoredEntries.length, "entries");
        }
      }
    }

    // Define system prompts based on user type
    const creatorSystemPrompt = `You are Seeksy AI. Get straight to the point and help creators take action quickly.

**Your mission**: Understand what they need, then immediately guide them to the right place or give them what they asked for.

**Response style**:
- Be concise and action-oriented (2-3 sentences max unless they ask for detail)
- Provide direct links or navigation instructions when relevant
- Skip lengthy explanations unless requested
- Focus on "here's what to do next" over "here's background info"

**What you help with**:
- Creating Seekies (Meetings, Events, Polls, Sign-ups, Podcasts)
- Writing compelling content (bios, descriptions, emails)
- Platform navigation and feature guidance
- Content discovery and recommendations
- Support tickets (when users need help or report issues)

**Tools you have**:
- search_podcast_transcripts: Search their own podcast content
- recommend_podcasts: Find podcasts for them to listen to
- create_support_ticket: Create support tickets when users need help or report issues

**Example interactions**:
User: "Create a meeting"
You: "I'll help you set up a meeting Seeky. Go to /meeting-types/create to get started, or tell me about your meeting and I'll suggest smart defaults."

User: "How do I send emails?"
You: "Head to /marketing to compose and send emails to your contacts. Need help writing one?"

User: "I need help" or "Something isn't working"
You: "I'll help you create a support ticket. I need your name, email, phone, and a description of the issue."
${knowledgeContext}

Keep it brief. Take them where they need to go.`;

    const adminSystemPrompt = `You are Seeksy AI - Admin Assistant. You help administrators manage the Seeksy platform efficiently.

**Your mission**: Provide quick guidance for admin tasks, system management, and customer support.

**Response style**:
- Be concise and action-oriented (2-3 sentences max unless they ask for detail)
- Provide direct links to admin pages when relevant
- Skip lengthy explanations unless requested
- Focus on "here's what to do next" over "here's background info"

**Admin capabilities you help with**:
- User management (viewing users, managing credits, impersonating users)
- Client management (creators, agency accounts)
- Analytics and reporting (podcast stats, impressions, revenue)
- Operations (meetings, sign-ups, events, studio sessions)
- Financial management (revenue tracking, billing, payments)
- Advertising management (campaigns, advertisers, ad performance)
- Marketing & Sales (leads, email campaigns)
- System monitoring and support tickets

**Admin navigation**:
- Customer Support: /tickets, /email-history
- Management: /crm, /admin/impersonate, /admin/credits
- Client Management: /admin/creators, /admin/agency
- Analytics: /admin/analytics, /admin/analytics/podcasts, /admin/analytics/impressions
- Operations: /meetings, /admin/signups, /events, /studio
- Financials: /admin/revenue, /admin/billing, /admin/payments
- Advertising: /admin/advertising, /admin/campaigns, /admin/advertisers
- Marketing & Sales: /marketing, /sales-dashboard, /leads-dashboard

**Example interactions**:
Admin: "How do I add credits to a user?"
You: "Go to /admin/credits to manage user credits. You can search for any user and add credits directly from there."

Admin: "Show me podcast analytics"
You: "Head to /admin/analytics/podcasts to see detailed podcast performance metrics including listens, impressions, and engagement."

Admin: "I need to check creator accounts"
You: "Visit /admin/creators to view and manage all creator accounts on the platform."
${knowledgeContext}

Keep responses brief and focused on admin workflows.`;

    const systemPrompt = isAdmin ? adminSystemPrompt : creatorSystemPrompt;

    // Build request body
    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    // Only add tools if user is authenticated
    if (userId) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "search_podcast_transcripts",
            description: "Search through the creator's OWN podcast episode transcripts to find specific content, topics, or quotes. Only use this when they ask about content from their own podcasts.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to find in the creator's podcast transcripts"
                }
              },
              required: ["query"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "recommend_podcasts",
            description: "Find and recommend podcasts for the creator to LISTEN TO and discover. Use this when they want podcast recommendations, ask 'what should I listen to', or want to discover new content. Works with any topic or can return general recommendations.",
            parameters: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The topic or interest area (e.g., 'technology', 'business', 'comedy', 'health'). Can be broad like 'any' or 'anything' to get general recommendations."
                },
                limit: {
                  type: "number",
                  description: "Maximum number of recommendations to return (default: 5)"
                }
              },
              required: ["topic"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "create_support_ticket",
            description: "Create a support ticket when users report issues, need help, or have questions. Collect all required information before calling this.",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "User's full name"
                },
                email: {
                  type: "string",
                  description: "User's email address"
                },
                phone: {
                  type: "string",
                  description: "User's phone number"
                },
                message: {
                  type: "string",
                  description: "Description of the issue or question"
                }
              },
              required: ["name", "email", "phone", "message"]
            }
          }
        }
      ];
      requestBody.tool_choice = "auto";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    // Handle streaming with potential tool calls
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let toolCallBuffer = "";
        let isCollectingToolCall = false;
        let toolCallId = "";
        let toolName = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || line.startsWith(":")) continue;
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                // Handle tool calls
                if (delta?.tool_calls?.[0]) {
                  const toolCall = delta.tool_calls[0];
                  
                  if (toolCall.function?.name) {
                    isCollectingToolCall = true;
                    toolCallId = toolCall.id || "";
                    toolName = toolCall.function.name;
                    toolCallBuffer = toolCall.function.arguments || "";
                  } else if (toolCall.function?.arguments) {
                    toolCallBuffer += toolCall.function.arguments;
                  }
                }

                // Check if tool call is complete
                if (isCollectingToolCall && parsed.choices?.[0]?.finish_reason === "tool_calls") {
                  console.log("Tool call complete:", toolName, toolCallBuffer);
                  
                  // Execute tool
                  let toolResults: any = [];
                  
                  if (toolName === "search_podcast_transcripts") {
                    const args = JSON.parse(toolCallBuffer);
                    const { query } = args;

                    const { data: episodes } = await supabase
                      .from("episodes")
                      .select(`
                        id,
                        title,
                        transcript,
                        podcast_id,
                        podcasts!inner(title, user_id)
                      `)
                      .eq("podcasts.user_id", userId)
                      .not("transcript", "is", null)
                      .ilike("transcript", `%${query}%`)
                      .limit(5);

                    toolResults = episodes?.map(ep => {
                      const podcast = ep.podcasts as any;
                      return {
                        podcast: podcast?.title || "Unknown Podcast",
                        episode: ep.title,
                        excerpt: extractExcerpt(ep.transcript || "", query, 200)
                      };
                    }) || [];
                  } else if (toolName === "recommend_podcasts") {
                    const args = JSON.parse(toolCallBuffer);
                    const { topic, limit = 5 } = args;

                    // Search podcasts - fetch all if no specific topic, or search by topic
                    let podcastsQuery = supabase
                      .from("podcasts")
                      .select(`
                        id,
                        title,
                        description,
                        cover_image,
                        category,
                        rss_feed_url,
                        episodes(id)
                      `)
                      .eq("published", true);
                    
                    // Only filter by topic if a meaningful topic is provided
                    if (topic && topic.toLowerCase() !== 'any' && topic.toLowerCase() !== 'anything') {
                      podcastsQuery = podcastsQuery.or(`title.ilike.%${topic}%,description.ilike.%${topic}%,category.ilike.%${topic}%`);
                    }
                    
                    const { data: podcasts } = await podcastsQuery.limit(limit);

                    toolResults = podcasts?.map(podcast => ({
                      id: podcast.id,
                      title: podcast.title,
                      description: podcast.description || "No description available",
                      category: podcast.category,
                      episodeCount: Array.isArray(podcast.episodes) ? podcast.episodes.length : 0,
                      link: `/podcasts/${podcast.id}`
                    })) || [];
                    
                    console.log("Found podcasts:", toolResults.length);
                  } else if (toolName === "create_support_ticket") {
                    const args = JSON.parse(toolCallBuffer);
                    const { name, email, phone, message } = args;

                    // Create a support ticket
                    const { data: ticket, error: ticketError } = await supabase
                      .from("client_tickets")
                      .insert({
                        user_id: userId,
                        title: "Support Request from Chat",
                        description: message,
                        category: "support",
                        priority: "medium",
                        status: "open"
                      })
                      .select()
                      .single();

                    if (ticketError) {
                      console.error("Failed to create support ticket:", ticketError);
                      toolResults = { success: false, error: ticketError.message };
                    } else {
                      // Store contact info in ticket metadata or separate table
                      console.log("Support ticket created:", ticket.id, "for", name, email, phone);
                      toolResults = { 
                        success: true, 
                        ticketId: ticket.id,
                        message: "Support ticket created successfully. Our team will reach out soon."
                      };
                    }
                  }

                  // Send tool result back to AI
                  const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${LOVABLE_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      model: "google/gemini-2.5-flash",
                      messages: [
                        { role: "system", content: systemPrompt },
                        ...messages,
                        {
                          role: "assistant",
                          content: null,
                          tool_calls: [{
                            id: toolCallId,
                            type: "function",
                            function: {
                              name: toolName,
                              arguments: toolCallBuffer
                            }
                          }]
                        },
                        {
                          role: "tool",
                          tool_call_id: toolCallId,
                          content: JSON.stringify(toolResults)
                        }
                      ],
                      stream: true
                    }),
                  });

                  // Stream the AI's response to tool result
                  const toolReader = toolResponse.body!.getReader();
                  while (true) {
                    const { done: toolDone, value: toolValue } = await toolReader.read();
                    if (toolDone) break;
                    controller.enqueue(toolValue);
                  }

                  isCollectingToolCall = false;
                  toolCallBuffer = "";
                } else if (!isCollectingToolCall) {
                  // Regular content streaming
                  controller.enqueue(encoder.encode(line + "\n"));
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Seeksy Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractExcerpt(text: string, query: string, maxLength: number): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text.substring(0, maxLength) + "...";
  
  const start = Math.max(0, index - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  const excerpt = text.substring(start, end);
  
  return (start > 0 ? "..." : "") + excerpt + (end < text.length ? "..." : "");
}
