import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs pricing (approximate, per minute of conversation)
const COST_PER_MINUTE = 0.07; // $0.07 per minute for conversational AI

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const JESS_AGENT_ID = Deno.env.get('ELEVENLABS_JESS_AGENT_ID');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('=== ELEVENLABS USAGE FETCH ===');
    if (JESS_AGENT_ID) {
      console.log(`Filtering by Jess Agent ID: ${JESS_AGENT_ID}`);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch conversations from ElevenLabs API - filter by agent if available
    let url = 'https://api.elevenlabs.io/v1/convai/conversations?page_size=100';
    if (JESS_AGENT_ID) {
      url += `&agent_id=${encodeURIComponent(JESS_AGENT_ID)}`;
    }
    
    const conversationsResponse = await fetch(url, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!conversationsResponse.ok) {
      const errorText = await conversationsResponse.text();
      console.error('Failed to fetch conversations:', errorText);
      throw new Error(`ElevenLabs API error: ${conversationsResponse.status}`);
    }

    const conversationsData = await conversationsResponse.json();
    const conversations = conversationsData.conversations || [];
    
    console.log(`Found ${conversations.length} conversations from ElevenLabs`);

    // Calculate usage from actual ElevenLabs conversations
    let monthlyTotalSeconds = 0;
    let todayTotalSeconds = 0;
    let monthlyCallCount = 0;
    let todayCallCount = 0;

    for (const conv of conversations) {
      const duration = conv.call_duration_secs || 0;
      const startTime = conv.start_time_unix_secs 
        ? new Date(conv.start_time_unix_secs * 1000) 
        : null;

      if (startTime && startTime >= startOfMonth) {
        monthlyTotalSeconds += duration;
        monthlyCallCount++;

        if (startTime >= startOfDay) {
          todayTotalSeconds += duration;
          todayCallCount++;
        }
      }
    }

    const monthlyMinutes = monthlyTotalSeconds / 60;
    const todayMinutes = todayTotalSeconds / 60;

    // Calculate estimated costs
    const estimatedMonthlySpend = monthlyMinutes * COST_PER_MINUTE;
    const estimatedTodaySpend = todayMinutes * COST_PER_MINUTE;

    // Project monthly spend based on current rate
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedMonthlySpend = dayOfMonth > 0 
      ? (estimatedMonthlySpend / dayOfMonth) * daysInMonth 
      : 0;

    // Also get subscription info
    let elevenLabsUsage = null;
    try {
      const usageResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });
      if (usageResponse.ok) {
        elevenLabsUsage = await usageResponse.json();
      }
    } catch (e) {
      console.warn('Failed to fetch subscription info:', e);
    }

    console.log('Usage calculated:', {
      monthlyCallCount,
      monthlyMinutes,
      todayCallCount,
      todayMinutes,
      estimatedMonthlySpend,
    });

    return new Response(JSON.stringify({
      success: true,
      usage: {
        monthly: {
          calls: monthlyCallCount,
          total_seconds: monthlyTotalSeconds,
          total_minutes: Math.round(monthlyMinutes * 10) / 10,
          estimated_cost: Math.round(estimatedMonthlySpend * 100) / 100,
          projected_cost: Math.round(projectedMonthlySpend * 100) / 100,
        },
        today: {
          calls: todayCallCount,
          total_seconds: todayTotalSeconds,
          total_minutes: Math.round(todayMinutes * 10) / 10,
          estimated_cost: Math.round(estimatedTodaySpend * 100) / 100,
        },
        pricing: {
          per_minute: COST_PER_MINUTE,
          currency: 'USD',
        },
        elevenlabs_subscription: elevenLabsUsage ? {
          tier: elevenLabsUsage.tier,
          character_count: elevenLabsUsage.character_count,
          character_limit: elevenLabsUsage.character_limit,
          next_character_count_reset_unix: elevenLabsUsage.next_character_count_reset_unix,
        } : null,
        last_updated: now.toISOString(),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Usage fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
