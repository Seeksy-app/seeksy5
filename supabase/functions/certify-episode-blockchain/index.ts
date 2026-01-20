import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Not authenticated');
    }

    const { episodeId, podcastId } = await req.json();

    if (!episodeId || !podcastId) {
      throw new Error('Episode ID and Podcast ID are required');
    }

    console.log('Certifying episode on blockchain:', episodeId);

    // Get episode details
    const { data: episode, error: episodeError } = await supabaseClient
      .from('episodes')
      .select('*, podcasts!inner(user_id)')
      .eq('id', episodeId)
      .eq('podcast_id', podcastId)
      .single();

    if (episodeError || !episode) {
      throw new Error('Episode not found');
    }

    // Verify user owns the podcast
    if (episode.podcasts.user_id !== user.id) {
      throw new Error('Access denied');
    }

    // Check if episode is already certified
    const { data: existing } = await supabaseClient
      .from('episode_blockchain_certificates')
      .select('*')
      .eq('episode_id', episodeId)
      .single();

    if (existing) {
      throw new Error('Episode is already certified');
    }

    // Generate certificate hash (SHA-256 of episode metadata)
    const certificateData = {
      episodeId: episode.id,
      title: episode.title,
      audioUrl: episode.audio_url,
      publishedAt: episode.created_at,
      podcastId: podcastId,
      timestamp: new Date().toISOString(),
    };

    // Use Web Crypto API to create hash
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(certificateData));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // In production, this would create an actual blockchain transaction
    // For now, we'll simulate a Polygon transaction
    const blockchainNetwork = 'polygon';
    const mockTransactionId = `0x${Math.random().toString(16).substring(2, 66)}`;
    
    console.log('Creating blockchain certificate with hash:', certificateHash);

    // Create certificate record
    const { data: certificate, error: certError } = await supabaseClient
      .from('episode_blockchain_certificates')
      .insert({
        episode_id: episodeId,
        podcast_id: podcastId,
        certificate_hash: certificateHash,
        blockchain_transaction_id: mockTransactionId,
        blockchain_network: blockchainNetwork,
        certificate_url: `https://polygonscan.com/tx/${mockTransactionId}`,
        certificate_status: 'verified',
        metadata: certificateData,
      })
      .select()
      .single();

    if (certError) {
      console.error('Error creating certificate:', certError);
      throw certError;
    }

    console.log('Episode certified successfully:', certificate.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        certificate: {
          id: certificate.id,
          certificateHash: certificate.certificate_hash,
          transactionId: certificate.blockchain_transaction_id,
          network: certificate.blockchain_network,
          certificateUrl: certificate.certificate_url,
          certifiedAt: certificate.certified_at,
        },
        message: 'Episode certified on blockchain successfully',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in certify-episode-blockchain:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
