import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid token");
    }

    // Check if user has super_admin role
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (roleError || !roles) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Super Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { targetUserId, newRole, newRoles } = await req.json();

    // Support both single role (newRole) and multiple roles (newRoles) for backwards compatibility
    const rolesToAssign: string[] = newRoles || (newRole ? [newRole] : []);

    if (!targetUserId || rolesToAssign.length === 0) {
      throw new Error("targetUserId and at least one role (newRole or newRoles) are required");
    }

    console.log(`Super Admin ${user.id} is changing roles for user ${targetUserId} to [${rolesToAssign.join(', ')}]`);

    // Delete existing roles for the target user
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);

    if (deleteError) {
      throw new Error(`Failed to delete existing roles: ${deleteError.message}`);
    }

    // Insert all new roles
    const roleInserts = rolesToAssign.map(role => ({ user_id: targetUserId, role }));
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert(roleInserts);

    if (insertError) {
      throw new Error(`Failed to assign new roles: ${insertError.message}`);
    }

    console.log(`Successfully updated roles for user ${targetUserId} to [${rolesToAssign.join(', ')}]`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Roles updated to ${rolesToAssign.join(', ')}`,
        userId: targetUserId,
        newRoles: rolesToAssign
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error managing user role:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
