import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
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
    const { data: adminCheck } = await supabaseAdmin
      .from("trucking_admin_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Super Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, email, password, deleteUserId } = await req.json();
    console.log(`Admin ${user.email} performing action: ${action}`);

    if (action === "delete") {
      // Delete user by ID
      if (!deleteUserId) {
        throw new Error("deleteUserId is required for delete action");
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(deleteUserId);
      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        throw new Error(`Failed to delete user: ${deleteError.message}`);
      }

      // Also remove from trucking_admin_users
      await supabaseAdmin
        .from("trucking_admin_users")
        .delete()
        .eq("user_id", deleteUserId);

      console.log(`Successfully deleted user: ${deleteUserId}`);
      return new Response(
        JSON.stringify({ success: true, message: "User deleted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create") {
      // Create new user with password
      if (!email || !password) {
        throw new Error("email and password are required for create action");
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      console.log(`Successfully created user: ${email}`);
      return new Response(
        JSON.stringify({ success: true, userId: newUser.user.id, email: email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset-password") {
      // Find user by email and update password
      if (!email || !password) {
        throw new Error("email and password are required for reset-password action");
      }

      // Get user by email
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!targetUser) {
        throw new Error(`User not found: ${email}`);
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { password: password }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      console.log(`Successfully reset password for: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Password updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("Admin user error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
