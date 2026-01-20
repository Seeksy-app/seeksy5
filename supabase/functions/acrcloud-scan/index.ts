import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit costs per scan frequency
const SCAN_CREDIT_COSTS: Record<string, number> = {
  hourly: 5,
  daily: 2,
  weekly: 1,
  monthly: 0,
};

// Auto-degradation: reduce frequency as content ages
function getAutoFrequency(contentCreatedAt: Date): string {
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - contentCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (ageInDays <= 7) return 'hourly';    // First week: hourly
  if (ageInDays <= 30) return 'daily';     // First month: daily
  if (ageInDays <= 90) return 'weekly';    // First 3 months: weekly
  return 'monthly';                         // After 3 months: monthly
}

function getNextScanTime(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

async function generateACRCloudSignature(
  accessKey: string,
  accessSecret: string,
  timestamp: string
): Promise<string> {
  const stringToSign = `POST\n/v1/identify\n${accessKey}\naudio\n1\n${timestamp}`;
  const encoder = new TextEncoder();
  const key = encoder.encode(accessSecret);
  const data = encoder.encode(stringToSign);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function scanWithACRCloud(
  audioUrl: string,
  accessKey: string,
  accessSecret: string,
  host: string
): Promise<any> {
  console.log('Fetching audio from:', audioUrl);
  
  // Fetch the audio file
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
  }
  
  const audioBuffer = await audioResponse.arrayBuffer();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateACRCloudSignature(accessKey, accessSecret, timestamp);
  
  // Create form data for ACRCloud
  const formData = new FormData();
  formData.append('sample', new Blob([audioBuffer]), 'audio.mp3');
  formData.append('access_key', accessKey);
  formData.append('data_type', 'audio');
  formData.append('signature_version', '1');
  formData.append('signature', signature);
  formData.append('sample_bytes', audioBuffer.byteLength.toString());
  formData.append('timestamp', timestamp);
  
  console.log('Sending to ACRCloud...');
  
  const acrResponse = await fetch(`https://${host}/v1/identify`, {
    method: 'POST',
    body: formData,
  });
  
  if (!acrResponse.ok) {
    throw new Error(`ACRCloud request failed: ${acrResponse.statusText}`);
  }
  
  return await acrResponse.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contentId, forceRun } = await req.json().catch(() => ({}));
    
    console.log('Starting ACRCloud scan...', { contentId, forceRun });
    
    // Get ACRCloud credentials
    const accessKey = Deno.env.get('ACRCLOUD_ACCESS_KEY');
    const accessSecret = Deno.env.get('ACRCLOUD_ACCESS_SECRET');
    const host = Deno.env.get('ACRCLOUD_HOST');
    
    if (!accessKey || !accessSecret || !host) {
      throw new Error('ACRCloud credentials not configured');
    }

    // Build query for content to scan
    let query = supabase
      .from('protected_content')
      .select('*, content_scan_settings!inner(*)');
    
    if (contentId) {
      // Scan specific content
      query = query.eq('id', contentId);
    } else {
      // Scan content due for scanning
      query = query
        .or('next_scan_at.is.null,next_scan_at.lte.now()')
        .neq('scan_frequency', 'disabled');
    }
    
    const { data: contentToScan, error: fetchError } = await query.limit(10);
    
    if (fetchError) {
      console.error('Error fetching content:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${contentToScan?.length || 0} items to scan`);
    
    const results = [];
    
    for (const content of contentToScan || []) {
      try {
        // Determine effective frequency
        let effectiveFrequency = content.scan_frequency;
        if (effectiveFrequency === 'auto') {
          effectiveFrequency = getAutoFrequency(new Date(content.created_at));
        }
        
        const creditCost = SCAN_CREDIT_COSTS[effectiveFrequency] || 0;
        
        // Check user credits if cost > 0
        if (creditCost > 0) {
          const { data: userCredits } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', content.user_id)
            .single();
          
          if (!userCredits || userCredits.balance < creditCost) {
            console.log(`Insufficient credits for user ${content.user_id}, skipping`);
            results.push({
              contentId: content.id,
              status: 'skipped',
              reason: 'insufficient_credits',
            });
            continue;
          }
          
          // Deduct credits
          const { error: deductError } = await supabase.functions.invoke('deduct-credit', {
            body: {
              activityType: 'content_scan',
              description: `ACRCloud scan (${effectiveFrequency})`,
              metadata: { contentId: content.id, frequency: effectiveFrequency },
            },
          });
          
          if (deductError) {
            console.error('Error deducting credits:', deductError);
          }
        }
        
        // Perform ACRCloud scan
        const scanResult = await scanWithACRCloud(
          content.source_url,
          accessKey,
          accessSecret,
          host
        );
        
        console.log('ACRCloud result:', JSON.stringify(scanResult));
        
        // Check for matches
        const hasMatch = scanResult?.status?.code === 0 && scanResult?.metadata?.music?.length > 0;
        
        if (hasMatch) {
          // Log the match
          for (const match of scanResult.metadata.music) {
            await supabase.from('content_matches').insert({
              protected_content_id: content.id,
              user_id: content.user_id,
              match_type: 'audio_fingerprint',
              platform: 'acrcloud',
              matched_url: null,
              confidence_score: match.score / 100,
              match_metadata: match,
              status: 'pending_review',
            });
          }
          
          // Send notification if enabled
          const settings = content.content_scan_settings;
          if (settings?.notify_on_match) {
            // Notify via in-app notification (could extend to email)
            try {
              await supabase.from('notifications').insert({
                user_id: content.user_id,
                type: 'content_match',
                title: 'Content Match Detected',
                message: `A potential match was found for "${content.title}"`,
                data: { contentId: content.id, matchCount: scanResult.metadata.music.length },
              });
            } catch (notifyErr) {
              console.log('Notification insert failed:', notifyErr);
            }
          }
        }
        
        // Update content with scan results
        const nextScanAt = getNextScanTime(effectiveFrequency);
        await supabase
          .from('protected_content')
          .update({
            last_scanned_at: new Date().toISOString(),
            next_scan_at: nextScanAt.toISOString(),
            total_scans: (content.total_scans || 0) + 1,
            credits_spent: (content.credits_spent || 0) + creditCost,
          })
          .eq('id', content.id);
        
        results.push({
          contentId: content.id,
          status: 'success',
          hasMatch,
          matchCount: hasMatch ? scanResult.metadata.music.length : 0,
          creditCost,
          nextScanAt,
        });
        
      } catch (contentError: unknown) {
        const errMsg = contentError instanceof Error ? contentError.message : 'Unknown error';
        console.error(`Error scanning content ${content.id}:`, contentError);
        results.push({
          contentId: content.id,
          status: 'error',
          error: errMsg,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, scanned: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('ACRCloud scan error:', error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});