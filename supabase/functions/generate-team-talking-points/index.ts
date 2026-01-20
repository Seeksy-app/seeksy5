import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Generating ${teamType} talking points...`);

    // Fetch relevant data based on team type
    let contextData: any = {};
    
    if (teamType === 'cfo' || teamType === 'finance') {
      // Fetch financial metrics
      const [
        { count: totalUsers },
        { count: activeCreators },
        { data: impressions },
        { data: campaigns },
        { data: sponsorships },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'creator'),
        supabase.from('ad_impressions').select('*'),
        supabase.from('ad_campaigns').select('budget, total_spent'),
        supabase.from('award_sponsorships').select('amount_paid').eq('status', 'paid'),
      ]);
      
      contextData = {
        totalUsers: totalUsers || 0,
        activeCreators: activeCreators || 0,
        totalImpressions: impressions?.length || 0,
        campaignBudget: campaigns?.reduce((sum: number, c: any) => sum + Number(c.budget), 0) || 0,
        sponsorshipRevenue: sponsorships?.reduce((sum: number, s: any) => sum + Number(s.amount_paid), 0) || 0,
      };
    } else if (teamType === 'sales') {
      // Fetch sales data
      const [
        { data: leads },
        { data: campaigns },
        { data: advertisers },
        { data: emailLogs },
      ] = await Promise.all([
        supabase.from('contacts').select('lead_status, lead_source, created_at'),
        supabase.from('multi_channel_campaigns').select('*'),
        supabase.from('advertisers').select('status, created_at, account_balance'),
        supabase.from('email_logs').select('email_type, recipient_email, sent_at, status'),
      ]);
      
      const activeLeads = leads?.filter((l: any) => ['new', 'contacted', 'qualified'].includes(l.lead_status)) || [];
      const wonLeads = leads?.filter((l: any) => l.lead_status === 'won') || [];
      const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active') || [];
      
      contextData = {
        totalLeads: leads?.length || 0,
        activeLeads: activeLeads.length,
        wonLeads: wonLeads.length,
        conversionRate: leads?.length ? (wonLeads.length / leads.length * 100).toFixed(1) : 0,
        activeCampaigns: activeCampaigns.length,
        totalAdvertisers: advertisers?.length || 0,
        approvedAdvertisers: advertisers?.filter((a: any) => a.status === 'approved').length || 0,
        pendingAdvertisers: advertisers?.filter((a: any) => a.status === 'pending').length || 0,
        emailsSent: emailLogs?.length || 0,
        emailsSentThisMonth: emailLogs?.filter((e: any) => {
          const sent = new Date(e.sent_at);
          const now = new Date();
          return sent.getMonth() === now.getMonth() && sent.getFullYear() === now.getFullYear();
        }).length || 0,
      };
    }

    // Generate talking points based on team type
    let systemPrompt = '';
    let userPrompt = '';
    
    if (teamType === 'cfo' || teamType === 'finance') {
      systemPrompt = `You are an expert CFO and strategic advisor preparing executive-level investor talking points. 
Your goal is to create clear, concise, and compelling narratives that highlight business performance, growth trajectory, and strategic positioning.

Format talking points into these sections:
1. **Executive Summary** - One paragraph overview
2. **Revenue & Growth** - Key revenue streams and growth metrics
3. **Unit Economics** - Margins, efficiency metrics
4. **Market Position** - Competitive advantages
5. **Forward Guidance** - Strategic initiatives
6. **Key Risks & Mitigation** - Challenges and solutions

Use data-driven language, specific numbers, and percentages. Be confident but realistic.`;

      userPrompt = `Generate investor talking points based on current business metrics:

**Key Metrics:**
- Total Users: ${contextData.totalUsers.toLocaleString()}
- Active Creators: ${contextData.activeCreators.toLocaleString()}
- Total Ad Impressions: ${contextData.totalImpressions.toLocaleString()}
- Campaign Budget: $${contextData.campaignBudget.toLocaleString()}
- Sponsorship Revenue: $${contextData.sponsorshipRevenue.toLocaleString()}

Create comprehensive, investor-ready talking points that tell a compelling growth story.`;
    } else if (teamType === 'sales') {
      systemPrompt = `You are an expert sales strategist preparing tactical talking points for the sales team.
Your goal is to create actionable insights and conversation starters based on current pipeline data, recent successes, and engagement patterns.

Format talking points into these sections:
1. **Pipeline Snapshot** - Current lead status and conversion metrics
2. **Recent Wins** - Success stories and closed deals
3. **Key Outreach Opportunities** - High-value prospects to prioritize
4. **Objection Handling** - Common concerns and proven responses
5. **Engagement Insights** - What's resonating in outreach
6. **Action Items** - Top 3-5 priorities for this week

Use specific numbers, actionable insights, and sales-focused language.`;

      userPrompt = `Generate sales talking points based on current pipeline and activity:

**Pipeline Metrics:**
- Total Leads: ${contextData.totalLeads}
- Active Leads: ${contextData.activeLeads}
- Won Deals: ${contextData.wonLeads}
- Conversion Rate: ${contextData.conversionRate}%
- Active Campaigns: ${contextData.activeCampaigns}
- Total Advertisers: ${contextData.totalAdvertisers}
  - Approved: ${contextData.approvedAdvertisers}
  - Pending Review: ${contextData.pendingAdvertisers}
- Emails Sent This Month: ${contextData.emailsSentThisMonth}

Create sales-focused talking points that help the team close deals and engage prospects effectively.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Failed to generate talking points');
    }

    const data = await response.json();
    const talkingPoints = data.choices[0].message.content;

    console.log('Talking points generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        talkingPoints,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating talking points:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});