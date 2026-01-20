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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results: Record<string, { deleted: number; error?: string }> = {};

    // List of user-related tables to clean
    const tablesToClean = [
      "user_roles",
      "profiles",
      "board_invitations",
      "board_members",
      "sales_team_members",
      "user_workspaces",
      "workspace_invitations",
      "user_landing_pages",
      "user_preferences",
      "user_devices",
      "notification_preferences",
      "email_logs",
      "chat_messages",
      "chat_sessions",
    ];

    console.log("Starting full user data cleanup...");

    for (const table of tablesToClean) {
      try {
        // First check if table exists by trying to select from it
        const { count, error: countError } = await supabaseClient
          .from(table)
          .select("*", { count: "exact", head: true });

        if (countError) {
          // Table might not exist, skip it
          console.log(`Table ${table} not found or inaccessible: ${countError.message}`);
          results[table] = { deleted: 0, error: "Table not found" };
          continue;
        }

        // Delete all rows from the table
        const { error: deleteError } = await supabaseClient
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows (neq with impossible value)

        if (deleteError) {
          console.error(`Error cleaning ${table}:`, deleteError.message);
          results[table] = { deleted: 0, error: deleteError.message };
        } else {
          results[table] = { deleted: count || 0 };
          console.log(`Cleaned ${table}: ${count || 0} rows removed`);
        }
      } catch (e) {
        console.error(`Exception cleaning ${table}:`, e);
        results[table] = { deleted: 0, error: String(e) };
      }
    }

    // Also clean any auth.users via admin API
    console.log("Fetching auth users to delete...");
    const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
    
    let authDeleted = 0;
    const authErrors: string[] = [];
    
    if (listError) {
      console.error("Error listing auth users:", listError.message);
      authErrors.push(listError.message);
    } else if (authUsers?.users) {
      for (const user of authUsers.users) {
        console.log(`Deleting auth user: ${user.email} (${user.id})`);
        const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);
        if (deleteUserError) {
          console.error(`Failed to delete ${user.email}:`, deleteUserError.message);
          authErrors.push(`${user.email}: ${deleteUserError.message}`);
        } else {
          authDeleted++;
        }
      }
    }

    results["auth.users"] = { 
      deleted: authDeleted, 
      error: authErrors.length > 0 ? authErrors.join("; ") : undefined 
    };

    console.log("Cleanup complete!", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Full cleanup complete",
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
