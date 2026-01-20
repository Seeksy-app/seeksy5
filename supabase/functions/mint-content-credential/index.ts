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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { content_type, transcript_id, blog_post_id } = await req.json();

    if (!content_type || (!transcript_id && !blog_post_id)) {
      throw new Error('Missing required fields');
    }

    console.log('Minting content credential:', content_type, { transcript_id, blog_post_id });

    // Fetch content to hash
    let contentText = '';
    let title = '';
    let summary = '';

    if (content_type === 'transcript' && transcript_id) {
      const { data: transcript, error: transcriptError } = await supabaseClient
        .from('transcripts')
        .select('raw_text, metadata')
        .eq('id', transcript_id)
        .single();

      if (transcriptError || !transcript) {
        throw new Error('Transcript not found');
      }

      contentText = transcript.raw_text;
      title = `Transcript - ${new Date().toLocaleDateString()}`;
      summary = contentText.substring(0, 200) + (contentText.length > 200 ? '...' : '');
    } else if (content_type === 'blog_post' && blog_post_id) {
      const { data: blog, error: blogError } = await supabaseClient
        .from('blog_posts')
        .select('title, content, excerpt')
        .eq('id', blog_post_id)
        .single();

      if (blogError || !blog) {
        throw new Error('Blog post not found');
      }

      contentText = blog.content;
      title = blog.title;
      summary = blog.excerpt || contentText.substring(0, 200) + (contentText.length > 200 ? '...' : '');
    }

    // Generate content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(contentText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Content hash generated:', contentHash.substring(0, 16) + '...');

    // Check if credential already exists
    const existingQuery = supabaseClient
      .from('content_credentials')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('content_type', content_type);

    if (content_type === 'transcript') {
      existingQuery.eq('transcript_id', transcript_id);
    } else {
      existingQuery.eq('blog_post_id', blog_post_id);
    }

    const { data: existing } = await existingQuery.single();

    if (existing && existing.status === 'minted') {
      throw new Error('Content already certified on-chain');
    }

    // Create or update credential record with pending status
    const credentialData = {
      user_id: user.id,
      content_type,
      transcript_id: content_type === 'transcript' ? transcript_id : null,
      blog_post_id: content_type === 'blog_post' ? blog_post_id : null,
      content_hash: contentHash,
      title,
      summary,
      status: 'pending',
    };

    let credentialId: string;

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabaseClient
        .from('content_credentials')
        .update(credentialData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      credentialId = updated.id;
    } else {
      // Create new
      const { data: created, error: createError } = await supabaseClient
        .from('content_credentials')
        .insert(credentialData)
        .select()
        .single();

      if (createError) throw createError;
      credentialId = created.id;
    }

    // Simulate blockchain minting (similar to voice NFT)
    const tokenId = `content-${Date.now()}-${contentHash.substring(0, 8)}`;
    
    const nftMetadata = {
      name: title,
      description: summary,
      content_type,
      content_hash: contentHash,
      creator_id: user.id,
      certification_date: new Date().toISOString(),
      attributes: [
        {
          trait_type: 'Content Type',
          value: content_type === 'transcript' ? 'Transcript' : 'Blog Post'
        },
        {
          trait_type: 'Platform',
          value: 'Seeksy'
        }
      ]
    };

    // Store metadata (simulated IPFS)
    const metadataString = JSON.stringify(nftMetadata);
    const metadataHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(metadataString)
    );
    const metadataHashArray = Array.from(new Uint8Array(metadataHash));
    const metadataHashHex = metadataHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const metadataUri = `ipfs://Qm${metadataHashHex.substring(0, 44)}`;

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const txHash = '0x' + Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('');

    console.log('Simulated minting complete:', txHash);

    // Update credential with minting results
    const { data: finalCredential, error: finalError } = await supabaseClient
      .from('content_credentials')
      .update({
        status: 'minted',
        tx_hash: txHash,
        token_id: tokenId,
        metadata_uri: metadataUri,
        nft_metadata: nftMetadata,
      })
      .eq('id', credentialId)
      .select()
      .single();

    if (finalError) throw finalError;

    return new Response(
      JSON.stringify({
        success: true,
        credential: finalCredential,
        transactionHash: txHash,
        tokenId,
        metadataUri,
        explorerUrl: `https://polygonscan.com/tx/${txHash}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error minting content credential:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
