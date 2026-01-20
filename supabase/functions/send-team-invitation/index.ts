import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
  role: string;
  team_id: string | null;
}

const generateBoardInviteHTML = (inviterName: string, inviteeName: string, signupUrl: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Board Portal Access - Seeksy</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header with Seeksy branding -->
            <tr>
              <td style="background: linear-gradient(135deg, #053877 0%, #1a4a8a 50%, #053877 100%); padding: 48px 40px; text-align: center;">
                <img src="https://seeksy.io/lovable-uploads/1619b7c7-cd5f-4c7a-8039-e411ed027566.png" alt="Seeksy" style="width: 120px; height: auto; margin-bottom: 16px;" />
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 600;">Board Portal</p>
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #111827;">Board Portal Access</p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #4B5563;">
                  Hello${inviteeName ? ' ' + inviteeName : ''},
                </p>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #4B5563;">
                  <strong style="color: #111827;">${inviterName}</strong> has invited you to access the <strong style="color: #053877;">Seeksy Board Portal</strong> as a Board Member.
                </p>

                <div style="background: linear-gradient(135deg, #053877 0%, #1a4a8a 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Your Access Includes</p>
                  <ul style="margin: 0; padding-left: 20px; color: #ffffff; font-size: 15px; line-height: 1.8;">
                    <li>Company Dashboard & KPIs</li>
                    <li>Business Model Overview</li>
                    <li>Go-To-Market Strategy</li>
                    <li>3-Year Financial Projections</li>
                    <li>Strategic Documents & Videos</li>
                  </ul>
                </div>

                <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.7; color: #4B5563;">
                  Click below to create your account and access the Board Portal:
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #053877 0%, #1a4a8a 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 16px rgba(5, 56, 119, 0.3);">
                        Access Board Portal →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 32px 0 0 0; font-size: 14px; color: #9CA3AF; text-align: center;">
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <img src="https://seeksy.io/lovable-uploads/1619b7c7-cd5f-4c7a-8039-e411ed027566.png" alt="Seeksy" style="width: 80px; height: auto; margin-bottom: 8px;" />
                      <p style="margin: 0; font-size: 13px; color: #6B7280;">Confidential Board Portal</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          
          <!-- Footer links -->
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 24px;">
            <tr>
              <td align="center">
                <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                  © ${new Date().getFullYear()} Seeksy. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const generateTeamInviteHTML = (inviterName: string, inviteeName: string, role: string, signupUrl: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Seeksy</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header with Seeksy branding -->
            <tr>
              <td style="background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); padding: 48px 40px; text-align: center;">
                <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 42px; font-weight: 800; letter-spacing: -1px;">Seeksy</h1>
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Creator & Podcast Platform</p>
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #111827;">You're Invited! 🎉</p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #4B5563;">
                  Hey${inviteeName ? ' ' + inviteeName : ''},
                </p>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #4B5563;">
                  <strong style="color: #111827;">${inviterName}</strong> has invited you to join their team on Seeksy as a <strong style="color: #2C6BED;">${role}</strong>.
                </p>

                <div style="background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Your Role</p>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #053877;">${role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>

                <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.7; color: #4B5563;">
                  Click the button below to create your account and get started:
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 16px rgba(5, 56, 119, 0.3);">
                        Accept Invitation →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 32px 0 0 0; font-size: 14px; color: #9CA3AF; text-align: center;">
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #053877;">Seeksy</p>
                      <p style="margin: 0; font-size: 13px; color: #6B7280;">The all-in-one platform for creators, podcasters & teams</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          
          <!-- Footer links -->
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 24px;">
            <tr>
              <td align="center">
                <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                  © ${new Date().getFullYear()} Seeksy. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

serve(async (req) => {
  console.log("📨 send-team-invitation function called at", new Date().toISOString());
  console.log("📨 Method:", req.method);
  
  if (req.method === "OPTIONS") {
    console.log("📨 Handling OPTIONS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔧 Initializing Supabase admin client...");
    
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    console.log("🔐 Authenticating user...");
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Auth error:", userError);
      throw new Error("Unauthorized");
    }
    
    console.log("✅ User authenticated:", user.id);

    const body = await req.json();
    console.log("📋 Request body:", JSON.stringify(body));
    
    const { email, name, role, team_id }: InviteRequest = body;
    
    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    // Get or create team_id
    console.log("🔍 Looking up team for user:", user.id);
    let actualTeamId = team_id;
    if (!actualTeamId) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      console.log("🏢 Team lookup result:", team, "Error:", teamError);
      
      if (team) {
        actualTeamId = team.id;
      }
    }
    console.log("🏢 Using team_id:", actualTeamId);

    // Check if user exists with this email using admin API
    console.log("👥 Checking if user exists with email:", email);
    const { data: existingUser, error: userLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    
    console.log("👥 Profile lookup result:", existingUser, "Error:", userLookupError);
    
    // Also check auth.users via admin API
    let invitedUser = null;
    if (!existingUser) {
      console.log("👥 Listing all users to find email match...");
      try {
        const { data: { users }, error: authLookupError } = await supabaseAdmin.auth.admin.listUsers();
        if (authLookupError) {
          console.error("❌ Error listing users:", authLookupError);
        } else {
          invitedUser = users?.find((u: any) => u.email === email);
          console.log("👥 Found user in auth.users:", invitedUser?.id || null);
        }
      } catch (listError) {
        console.error("❌ Exception listing users:", listError);
      }
    }

    if (invitedUser) {
      console.log("📧 User exists, adding to team and sending notification email...");
      
      // User exists, add to team_members table
      if (actualTeamId) {
        const { error: memberError } = await supabaseAdmin
          .from("team_members")
          .insert({
            team_id: actualTeamId,
            user_id: invitedUser.id,
            role: role,
          });

        // Ignore conflict errors if already a member
        if (memberError && !memberError.message.includes("duplicate")) {
          console.error("❌ Error adding to team_members:", memberError);
        }
      }

      // Mark onboarding as complete so they skip the wizard and go straight to dashboard
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", invitedUser.id);
      
      if (profileError) {
        console.error("❌ Error marking onboarding complete:", profileError);
      } else {
        console.log("✅ Onboarding marked complete for invited user");
      }

      // Also send notification email to existing user
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      console.log("🔑 Resend API Key configured:", !!resendApiKey);
      
      const resend = new Resend(resendApiKey);
      
      // Get inviter's name
      const { data: inviterProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();
      
      const inviterName = inviterProfile?.full_name || inviterProfile?.username || "A team member";
      
      // Track invitation in database
      const { data: inviteRecord, error: inviteError } = await supabaseAdmin
        .from("team_invitations")
        .insert({
          inviter_id: user.id,
          team_id: actualTeamId,
          invitee_email: email,
          invitee_name: name,
          role: role,
          status: "pending",
        })
        .select()
        .single();
      
      if (inviteError) {
        console.error("❌ Error creating invitation record:", inviteError);
      } else {
        console.log("✅ Invitation record created:", inviteRecord?.id);
      }
      
      const siteUrl = Deno.env.get("SITE_URL") || "https://seeksy.io";
      const loginUrl = `${siteUrl}/auth`;
      
      // Use board-specific email for board_member role
      const isBoardMember = role === 'board_member';
      const emailHTML = isBoardMember 
        ? generateBoardInviteHTML(inviterName, name || '', loginUrl)
        : generateTeamInviteHTML(inviterName, name || '', role, loginUrl);
      const emailSubject = isBoardMember 
        ? "📊 Board Portal Access - Seeksy"
        : "🎉 You've Been Added to a Team on Seeksy!";
      const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>";
      
      console.log("📧 Sending notification email to existing user:", email, "isBoardMember:", isBoardMember);
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: senderEmail,
        to: [email],
        subject: emailSubject,
        html: emailHTML,
      });

      if (emailError) {
        console.error("❌ Resend email error:", emailError);
      } else {
        console.log("✅ Notification email sent successfully:", emailData);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User added to team as ${role} and notified via email`,
          user_exists: true,
          email_sent: !emailError
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("📧 User doesn't exist, sending invitation email...");
      
      // User doesn't exist - invite them to sign up via magic link
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      console.log("🔑 Resend API Key configured:", !!resendApiKey);
      
      const resend = new Resend(resendApiKey);
      
      // Get inviter's name
      const { data: inviterProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();
      
      console.log("👤 Inviter profile:", inviterProfile, "Error:", profileError);
      
      const inviterName = inviterProfile?.full_name || inviterProfile?.username || "A team member";
      
      // Generate invite token for tracking
      const inviteToken = crypto.randomUUID();
      
      // Track invitation in database first
      const { data: inviteRecord, error: inviteError } = await supabaseAdmin
        .from("team_invitations")
        .insert({
          inviter_id: user.id,
          team_id: actualTeamId,
          invitee_email: email,
          invitee_name: name,
          role: role,
          status: "pending",
        })
        .select()
        .single();
      
      if (inviteError) {
        console.error("❌ Error creating invitation record:", inviteError);
        throw new Error(`Failed to create invitation record: ${inviteError.message}`);
      }
      
      console.log("✅ Invitation record created:", inviteRecord);
      
      // Build signup URL with pre-filled email
      const siteUrl = Deno.env.get("SITE_URL") || "https://seeksy.io";
      const signupUrl = `${siteUrl}/auth?email=${encodeURIComponent(email)}&invited=true&role=${role}`;
      
      // Use board-specific email for board_member role
      const isBoardMember = role === 'board_member';
      const emailHTML = isBoardMember 
        ? generateBoardInviteHTML(inviterName, name || '', signupUrl)
        : generateTeamInviteHTML(inviterName, name || '', role, signupUrl);
      const emailSubject = isBoardMember 
        ? "📊 Board Portal Access - Seeksy"
        : "🎉 You're Invited to Join Seeksy!";
      const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>";
      
      console.log("Attempting to send team invitation email:", {
        from: senderEmail,
        to: email,
        inviterName,
        role,
        isBoardMember,
      });

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: senderEmail,
        to: [email],
        subject: emailSubject,
        html: emailHTML,
      });

      if (emailError) {
        console.error("❌ Resend email error:", emailError);
        throw new Error(`Failed to send email: ${emailError.message || JSON.stringify(emailError)}`);
      }
      
      console.log("✅ Team invitation email sent successfully:", emailData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation email sent to " + email,
          user_exists: false,
          invite_sent: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-team-invitation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});