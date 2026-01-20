/**
 * Shared authentication helpers for edge functions.
 * Use these to verify JWT and check user roles.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  authenticated: boolean;
  userId: string | null;
  roles: string[];
  error?: string;
}

/**
 * Verify JWT from Authorization header and get user roles
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      userId: null,
      roles: [],
      error: "Missing or invalid Authorization header",
    };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  // Create client with user's JWT to verify it
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return {
      authenticated: false,
      userId: null,
      roles: [],
      error: userError?.message || "Invalid or expired token",
    };
  }

  // Use service role to get user's roles
  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: userRoles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    console.error("Failed to fetch user roles:", rolesError);
  }

  const roles = userRoles?.map((r) => r.role) ?? [];

  return {
    authenticated: true,
    userId: user.id,
    roles,
  };
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role);
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    }
  );
}

/**
 * Standard unauthenticated response
 */
export function unauthenticatedResponse(message: string = "Authentication required"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    }
  );
}

/**
 * Log auth event for auditing
 */
export function logAuthEvent(
  functionName: string,
  userId: string | null,
  roles: string[],
  action: string,
  success: boolean
): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    function: functionName,
    userId,
    roles,
    action,
    success,
  }));
}
