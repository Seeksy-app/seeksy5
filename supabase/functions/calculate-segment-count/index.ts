import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { segmentId, rules } = await req.json();

    if (!rules || !Array.isArray(rules)) {
      throw new Error("Invalid rules provided");
    }

    // Build query based on rules
    let query = supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Apply each rule
    for (const rule of rules) {
      const { field, operator, value } = rule;

      switch (field) {
        case "last_opened":
          if (operator === "within_days") {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(value));
            query = query.gte("last_opened_at", daysAgo.toISOString());
          } else if (operator === "not_within_days") {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(value));
            query = query.or(`last_opened_at.lt.${daysAgo.toISOString()},last_opened_at.is.null`);
          }
          break;

        case "last_clicked":
          if (operator === "within_days") {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(value));
            query = query.gte("last_clicked_at", daysAgo.toISOString());
          } else if (operator === "not_within_days") {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(value));
            query = query.or(`last_clicked_at.lt.${daysAgo.toISOString()},last_clicked_at.is.null`);
          }
          break;

        case "list":
          // Check if contact is in a specific list
          const { data: listMembers } = await supabase
            .from("contact_list_members")
            .select("contact_id")
            .eq("list_id", value);
          
          const contactIds = listMembers?.map(m => m.contact_id) || [];
          if (contactIds.length > 0) {
            query = query.in("id", contactIds);
          } else {
            // No contacts in this list, return 0
            return new Response(
              JSON.stringify({ count: 0 }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          break;

        case "tag":
          // Check if contact has a specific tag
          const { data: taggedContacts } = await supabase
            .from("contact_tag_assignments")
            .select("contact_id")
            .eq("tag_id", value);
          
          const taggedIds = taggedContacts?.map(t => t.contact_id) || [];
          if (taggedIds.length > 0) {
            query = query.in("id", taggedIds);
          } else {
            return new Response(
              JSON.stringify({ count: 0 }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          break;

        case "email":
          if (operator === "contains") {
            query = query.ilike("email", `%${value}%`);
          } else if (operator === "equals") {
            query = query.eq("email", value);
          }
          break;

        case "name":
          if (operator === "contains") {
            query = query.ilike("name", `%${value}%`);
          } else if (operator === "equals") {
            query = query.eq("name", value);
          }
          break;
      }
    }

    // Exclude unsubscribed contacts by default
    const { data: unsubscribedContacts } = await supabase
      .from("contact_preferences")
      .select("contact_id")
      .eq("global_unsubscribe", true);

    const unsubscribedIds = unsubscribedContacts?.map(p => p.contact_id) || [];
    if (unsubscribedIds.length > 0) {
      query = query.not("id", "in", `(${unsubscribedIds.join(",")})`);
    }

    // Execute query
    const { count, error } = await query;

    if (error) {
      console.error("❌ Segment count error:", error);
      throw error;
    }

    const finalCount = count || 0;

    // Update segment if segmentId provided
    if (segmentId) {
      await supabase
        .from("email_segments")
        .update({
          last_calculated_count: finalCount,
          last_calculated_at: new Date().toISOString(),
        })
        .eq("id", segmentId)
        .eq("user_id", user.id);
    }

    console.log(`📊 Segment count: ${finalCount}`);

    return new Response(
      JSON.stringify({ count: finalCount }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Calculate segment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
