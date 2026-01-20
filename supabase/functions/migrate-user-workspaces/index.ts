import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who have custom_packages but might not have workspaces set up properly
    const { data: customPackages, error: packagesError } = await supabase
      .from("custom_packages")
      .select("*");

    if (packagesError) {
      throw packagesError;
    }

    const migratedUsers: string[] = [];
    const skippedUsers: string[] = [];
    const errors: { userId: string; error: string }[] = [];

    for (const pkg of customPackages || []) {
      try {
        // Check if this package already has a slug (already migrated)
        if (pkg.slug) {
          skippedUsers.push(pkg.user_id);
          continue;
        }

        // Generate a slug for the workspace
        const slug = `workspace-${pkg.id.substring(0, 8)}`;

        // Update the custom_packages entry with workspace fields
        const { error: updateError } = await supabase
          .from("custom_packages")
          .update({
            slug,
            is_default: true,
            icon_color: "#2C6BED",
            description: "Your default Seeksy workspace",
          })
          .eq("id", pkg.id);

        if (updateError) {
          errors.push({ userId: pkg.user_id, error: updateError.message });
          continue;
        }

        // Migrate modules from the modules array to workspace_modules table
        const modules = pkg.modules || [];
        if (modules.length > 0) {
          const workspaceModules = modules.map((moduleKey: string, index: number) => ({
            workspace_id: pkg.id,
            module_key: moduleKey,
            position: index,
            settings: {},
          }));

          const { error: modulesError } = await supabase
            .from("workspace_modules")
            .upsert(workspaceModules, {
              onConflict: "workspace_id,module_key",
            });

          if (modulesError) {
            console.error(`Error migrating modules for user ${pkg.user_id}:`, modulesError);
            // Continue anyway, the workspace is created
          }
        }

        migratedUsers.push(pkg.user_id);
      } catch (userError) {
        errors.push({
          userId: pkg.user_id,
          error: userError instanceof Error ? userError.message : "Unknown error",
        });
      }
    }

    // Also handle users who have NO custom_packages at all
    const { data: allProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, display_name");

    if (!profilesError && allProfiles) {
      const usersWithPackages = new Set((customPackages || []).map(p => p.user_id));
      const usersWithoutPackages = allProfiles.filter(p => !usersWithPackages.has(p.id));

      for (const profile of usersWithoutPackages) {
        try {
          // Create a default workspace for this user
          const slug = `my-workspace-${profile.id.substring(0, 8)}`;
          
          const { data: newWorkspace, error: createError } = await supabase
            .from("custom_packages")
            .insert({
              user_id: profile.id,
              name: "My Seeksy Workspace",
              slug,
              is_default: true,
              icon_color: "#2C6BED",
              description: "Your default Seeksy workspace",
              modules: [],
            })
            .select()
            .single();

          if (createError) {
            errors.push({ userId: profile.id, error: createError.message });
            continue;
          }

          migratedUsers.push(profile.id);
        } catch (userError) {
          errors.push({
            userId: profile.id,
            error: userError instanceof Error ? userError.message : "Unknown error",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        migrated: migratedUsers.length,
        skipped: skippedUsers.length,
        errors: errors.length,
        details: {
          migratedUsers,
          skippedUsers,
          errors,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
