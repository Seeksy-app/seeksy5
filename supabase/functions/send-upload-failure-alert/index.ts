import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadFailureAlert {
  userId: string;
  userEmail: string;
  userName: string;
  fileName: string;
  fileSize: number;
  errorMessage: string;
  errorType: string;
  uploadProgress: number;
  userAgent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const alertData: UploadFailureAlert = await req.json();

    console.log('Upload failure alert received:', {
      userId: alertData.userId,
      fileName: alertData.fileName,
      errorType: alertData.errorType,
    });

    // Log failure to database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabaseAdmin
      .from('upload_failure_logs')
      .insert({
        user_id: alertData.userId,
        file_name: alertData.fileName,
        file_size_bytes: alertData.fileSize,
        error_message: alertData.errorMessage,
        error_type: alertData.errorType,
        upload_progress: alertData.uploadProgress,
        user_agent: alertData.userAgent,
      });

    if (dbError) {
      console.error('Failed to log upload failure:', dbError);
    }

    // Create in-app notification for admins
    console.log('Querying for admin users...');
    const { data: adminRoles, error: adminQueryError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin']);

    console.log('Admin query result:', { adminRoles, adminQueryError });

    if (adminQueryError) {
      console.error('Error querying admin roles:', adminQueryError);
    } else if (adminRoles && adminRoles.length > 0) {
      const adminUserIds = adminRoles.map(a => a.user_id);
      console.log('Found admin user IDs:', adminUserIds);
      
      // Create urgent notification for each admin
      const notifications = adminUserIds.map(adminId => ({
        user_id: adminId,
        title: '🚨 Upload Failure Alert',
        message: `${alertData.userName} failed to upload "${alertData.fileName}" (${(alertData.fileSize / (1024 * 1024)).toFixed(1)} MB) - ${alertData.errorType}`,
        type: 'urgent',
        category: 'upload_failure',
        link: '/admin/upload-logs',
        read: false
      }));

      console.log('Creating notifications:', notifications);
      const { data: insertedNotifications, error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select();

      if (notifError) {
        console.error('Failed to create notifications:', notifError);
      } else {
        console.log(`Successfully created ${insertedNotifications?.length || 0} urgent notifications for admins:`, insertedNotifications);
      }
    } else {
      console.log('No admin users found to notify');
    }

    // Send email alert to admins
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const senderEmail = Deno.env.get('SENDER_EMAIL_HELLO') || 'hello@seeksy.io';

    // Get admin emails
    const { data: admins } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin']);

    if (admins && admins.length > 0) {
      const adminUserIds = admins.map(a => a.user_id);
      
      // Get admin user details from auth
      const { data: { users: adminUsers } } = await supabaseAdmin.auth.admin.listUsers();
      const adminEmails = adminUsers
        ?.filter(u => adminUserIds.includes(u.id))
        .map(u => u.email)
        .filter(Boolean) as string[];

      if (adminEmails.length > 0) {
        const formatBytes = (bytes: number): string => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };

        await resend.emails.send({
          from: `Seeksy Alerts <${senderEmail}>`,
          to: adminEmails,
          subject: `🚨 Upload Failure Alert - ${alertData.fileName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">Upload Failure Alert</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #dc2626; margin-top: 0;">⚠️ Upload Failed</h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">User:</td>
                      <td style="padding: 12px 0; color: #1f2937;">${alertData.userName} (${alertData.userEmail})</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">File Name:</td>
                      <td style="padding: 12px 0; color: #1f2937;">${alertData.fileName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">File Size:</td>
                      <td style="padding: 12px 0; color: #1f2937;">${formatBytes(alertData.fileSize)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Error Type:</td>
                      <td style="padding: 12px 0; color: #1f2937;">
                        <span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                          ${alertData.errorType}
                        </span>
                      </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Upload Progress:</td>
                      <td style="padding: 12px 0; color: #1f2937;">${alertData.uploadProgress}%</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; font-weight: bold; color: #4b5563; vertical-align: top;">Error Message:</td>
                      <td style="padding: 12px 0; color: #dc2626; font-family: monospace; font-size: 12px; background: #fef2f2; padding: 8px; border-radius: 4px;">
                        ${alertData.errorMessage}
                      </td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    <strong>Action Required:</strong> Review the upload failure logs in the admin panel and contact the user if necessary.
                  </p>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                  <p>This is an automated alert from Seeksy Upload Monitoring System</p>
                  <p style="margin-top: 10px;">
                    <a href="https://seeksy.io/admin" style="color: #3b82f6; text-decoration: none;">View Admin Panel →</a>
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        console.log('Alert email sent to admins:', adminEmails);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Alert sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-upload-failure-alert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
