import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const today = new Date().toISOString().split('T')[0];

    // Get today's briefs
    const { data: briefs, error: briefsError } = await supabase
      .from('daily_briefs')
      .select('*')
      .eq('brief_date', today)
      .eq('is_sent', false);

    if (briefsError) throw briefsError;

    const results = [];

    for (const brief of briefs || []) {
      // Get subscribers for this audience type
      const { data: subscribers, error: subsError } = await supabase
        .from('brief_subscriptions')
        .select(`
          user_id,
          audience_type
        `)
        .eq('audience_type', brief.audience_type)
        .eq('is_active', true);

      if (subsError) {
        console.error('Subscribers error:', subsError);
        continue;
      }

      for (const sub of subscribers || []) {
        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        
        if (!userData?.user?.email) continue;

        const email = userData.user.email;

        // Format email content
        const competitiveInsights = (brief.competitive_insights || [])
          .map((i: any) => `<li><strong>${i.competitor}:</strong> ${i.insight} (Impact: ${i.impact})</li>`)
          .join('');

        const marketTrends = (brief.market_trends || [])
          .map((t: any) => `<li><strong>${t.trend}:</strong> ${t.implication}</li>`)
          .join('');

        const actionItems = (brief.action_items || [])
          .map((a: any) => `<li><strong>Priority ${a.priority}:</strong> ${a.action} - ${a.rationale}</li>`)
          .join('');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 680px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #053877 0%, #2C6BED 100%); color: white; padding: 32px; border-radius: 12px 12px 0 0; }
              .content { background: #f8fafc; padding: 24px; }
              .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .section h3 { color: #053877; margin-top: 0; border-bottom: 2px solid #2C6BED; padding-bottom: 8px; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
              .cta { display: inline-block; background: #2C6BED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">📊 ${brief.title}</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">${today}</p>
            </div>
            <div class="content">
              <div class="section">
                <h3>Executive Summary</h3>
                <p>${brief.summary}</p>
              </div>
              
              ${competitiveInsights ? `
              <div class="section">
                <h3>🎯 Competitive Insights</h3>
                <ul>${competitiveInsights}</ul>
              </div>
              ` : ''}
              
              ${marketTrends ? `
              <div class="section">
                <h3>📈 Market Trends</h3>
                <ul>${marketTrends}</ul>
              </div>
              ` : ''}
              
              ${brief.strategy_assessment?.seeksy_position ? `
              <div class="section">
                <h3>🏆 Seeksy Position</h3>
                <p>${brief.strategy_assessment.seeksy_position}</p>
                ${brief.strategy_assessment.opportunities?.length ? `<p><strong>Opportunities:</strong> ${brief.strategy_assessment.opportunities.join(', ')}</p>` : ''}
                ${brief.strategy_assessment.threats?.length ? `<p><strong>Threats:</strong> ${brief.strategy_assessment.threats.join(', ')}</p>` : ''}
              </div>
              ` : ''}
              
              ${actionItems ? `
              <div class="section">
                <h3>✅ Recommended Actions</h3>
                <ul>${actionItems}</ul>
              </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="https://seeksy.io/daily-brief" class="cta">View Full Brief in Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>Seeksy Competitive Intelligence • Powered by AI</p>
              <p>You're receiving this because you subscribed to ${brief.audience_type} briefs.</p>
            </div>
          </body>
          </html>
        `;

        try {
          await resend.emails.send({
            from: 'Seeksy Intelligence <intelligence@seeksy.io>',
            to: [email],
            subject: `${brief.title}`,
            html: htmlContent,
          });

          results.push({ email, status: 'sent' });
        } catch (emailError: any) {
          console.error('Email send error:', emailError);
          results.push({ email, status: 'failed', error: emailError.message });
        }
      }

      // Mark brief as sent
      await supabase
        .from('daily_briefs')
        .update({ is_sent: true })
        .eq('id', brief.id);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Send daily briefs error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
