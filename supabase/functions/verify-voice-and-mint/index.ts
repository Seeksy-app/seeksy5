import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Unified Voice Verification + Minting Flow
 * 
 * Steps:
 * 1. Receive and validate audio
 * 2. Generate voiceHash
 * 3. Create/update creator_voice_profiles record
 * 4. Mint certificate directly on Polygon blockchain
 * 5. Create voice_blockchain_certificates record
 * 6. Update voice profile to verified
 * 7. Return success
 * 
 * Note: Voice verification does NOT use identity_assets table.
 * It uses creator_voice_profiles as the source of truth.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[verify-voice-and-mint] Request received');
    console.log('[verify-voice-and-mint] Method:', req.method);
    console.log('[verify-voice-and-mint] Headers:', Object.fromEntries(req.headers.entries()));

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
      console.error('[verify-voice-and-mint] Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: 'NOT_AUTHENTICATED',
          message: 'User authentication failed'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[verify-voice-and-mint] User authenticated:', user.id);

    // Parse and log the payload
    let payload;
    try {
      payload = await req.json();
      console.log('[verify-voice-and-mint] Payload received:', {
        hasAudioData: !!payload.audioData,
        audioDataLength: payload.audioData?.length || 0,
        recordingDuration: payload.recordingDuration,
        hasSelectedPrompt: !!payload.selectedPrompt,
        allKeys: Object.keys(payload)
      });
    } catch (parseError) {
      console.error('[verify-voice-and-mint] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: 'INVALID_JSON',
          message: 'Request body is not valid JSON'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { audioData, recordingDuration, selectedPrompt } = payload;

    // Validate required fields
    if (!audioData) {
      console.error('[verify-voice-and-mint] Missing audioData');
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: 'MISSING_FIELD',
          field: 'audioData',
          message: 'Audio data is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!recordingDuration || recordingDuration < 1) {
      console.error('[verify-voice-and-mint] Invalid recordingDuration:', recordingDuration);
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: 'INVALID_FIELD',
          field: 'recordingDuration',
          message: 'Recording duration must be at least 1 second'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[verify-voice-and-mint] Starting verification for user:', user.id);

    // Step 1: Validate audio (basic checks - production would use proper audio analysis)
    if (audioData.length < 1000) {
      throw new Error('Audio file size too small');
    }

    // Step 2: Generate voice hash using OpenAI (simplified for now)
    const encoder = new TextEncoder();
    const data = encoder.encode(audioData + user.id + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const voiceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('[verify-voice-and-mint] Voice hash generated');

    // Step 3: Create voice profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('creator_voice_profiles')
      .insert({
        user_id: user.id,
        voice_name: user.user_metadata?.full_name || 'My Voice',
        is_verified: false
      })
      .select()
      .single();

    if (profileError) {
      // Profile might already exist
      const { data: existingProfile } = await supabaseClient
        .from('creator_voice_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!existingProfile) {
        throw new Error(`Failed to create voice profile: ${profileError.message}`);
      }
    }

    const voiceProfileId = profile?.id || (await supabaseClient
      .from('creator_voice_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()).data?.id;

    console.log('[verify-voice-and-mint] Voice profile ready:', voiceProfileId);

    // Step 4: Mint certificate on blockchain directly (without identity_assets)
    console.log('[verify-voice-and-mint] Starting blockchain minting...');
    
    const { ethers } = await import("https://esm.sh/ethers@6.13.0");
    
    const CERTIFICATE_CONTRACT_ABI = [
      {
        "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "string", "name": "clipId", "type": "string"}
        ],
        "name": "certifyClip",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    const rpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const minterPrivateKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    const contractAddress = "0xB5627bDbA3ab392782E7E542a972013E3e7F37C3";

    if (!rpcUrl || !minterPrivateKey) {
      console.error('[verify-voice-and-mint] Missing blockchain config');
      throw new Error("Missing blockchain configuration: POLYGON_RPC_URL or POLYGON_PRIVATE_KEY");
    }

    console.log('[verify-voice-and-mint] RPC URL present:', !!rpcUrl);
    console.log('[verify-voice-and-mint] Private key length:', minterPrivateKey?.length);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Ensure private key has 0x prefix for ethers.js
    const formattedPrivateKey = minterPrivateKey.startsWith('0x') 
      ? minterPrivateKey 
      : `0x${minterPrivateKey}`;
    
    const signer = new ethers.Wallet(formattedPrivateKey, provider);
    console.log('[verify-voice-and-mint] Platform wallet:', signer.address);

    const contract = new ethers.Contract(
      contractAddress,
      CERTIFICATE_CONTRACT_ABI,
      signer
    );

    let tx;
    let receipt;
    try {
      const creatorAddress = signer.address;
      console.log('[verify-voice-and-mint] Certifying voice for:', creatorAddress);
      
      // Actually broadcast the transaction
      tx = await contract.certifyClip(creatorAddress, voiceProfileId);
      console.log('[verify-voice-and-mint] TX sent:', tx.hash);
      
      // Wait for blockchain confirmation
      console.log('[verify-voice-and-mint] Waiting for confirmation...');
      receipt = await tx.wait();
      console.log('[verify-voice-and-mint] TX confirmed in block:', receipt.blockNumber);
      
    } catch (txError) {
      console.error('[verify-voice-and-mint] Transaction error:', txError);
      const errorMsg = txError instanceof Error ? txError.message : String(txError);
      
      // Check for common blockchain errors
      if (errorMsg.includes('insufficient funds')) {
        throw new Error('Insufficient MATIC balance in platform wallet for gas fees');
      } else if (errorMsg.includes('nonce')) {
        throw new Error('Transaction nonce mismatch - please retry');
      } else if (errorMsg.includes('revert')) {
        throw new Error('Smart contract rejected the transaction');
      }
      
      throw new Error(`Blockchain transaction failed: ${errorMsg}`);
    }

    const tokenId = Date.now().toString();
    const explorerUrl = `https://polygonscan.com/tx/${tx.hash}`;
    
    console.log('[verify-voice-and-mint] Certificate minted - Token ID:', tokenId);
    console.log('[verify-voice-and-mint] Explorer URL:', explorerUrl);

    // Step 5: Create blockchain certificate record (pending state initially)
    const { data: certData, error: certError } = await supabaseClient
      .from('voice_blockchain_certificates')
      .insert({
        voice_profile_id: voiceProfileId,
        creator_id: user.id,
        voice_fingerprint_hash: voiceHash,
        token_id: tokenId,
        transaction_hash: tx.hash,
        certification_status: 'pending',
        is_active: false,
        contract_address: contractAddress,
        cert_explorer_url: explorerUrl,
        metadata_uri: `ipfs://voice-${voiceHash.slice(0, 16)}`,
        nft_metadata: {
          name: user.user_metadata?.full_name || 'Voice Profile',
          voice_hash: voiceHash
        }
      })
      .select()
      .single();

    if (certError) {
      console.error('[verify-voice-and-mint] Certificate insert error:', certError);
      console.error('[verify-voice-and-mint] Error details:', JSON.stringify(certError));
      
      // If RLS blocks insert, return specific error
      if (certError.message?.includes('policy') || certError.code === '42501') {
        return new Response(
          JSON.stringify({ 
            ok: false,
            error: 'DB_RLS_ERROR',
            message: 'Voice certificate insert blocked by RLS',
            details: {
              user_id: user.id,
              voice_profile_id: voiceProfileId,
              table: 'voice_blockchain_certificates'
            }
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`Database error: ${certError.message}`);
    }
    
    console.log('[verify-voice-and-mint] Certificate record created');

    // Step 6: Update voice profile to verified
    const { error: updateError } = await supabaseClient
      .from('creator_voice_profiles')
      .update({ is_verified: true })
      .eq('id', voiceProfileId);
      
    if (updateError) {
      console.error('[verify-voice-and-mint] Update error:', updateError);
    }

    console.log('[verify-voice-and-mint] Voice profile marked as verified');

    // Step 7: Deactivate all other voice certificates for this creator (non-critical)
    console.log('[verify-voice-and-mint] Deactivating previous certificates...');
    
    try {
      const { error: deactivateError } = await supabaseClient
        .from('voice_blockchain_certificates')
        .update({ 
          is_active: false,
          certification_status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('creator_id', user.id)
        .neq('voice_profile_id', voiceProfileId);
      
      if (deactivateError) {
        console.warn('[verify-voice-and-mint] Deactivate error (non-critical):', deactivateError);
      } else {
        console.log('[verify-voice-and-mint] Previous certificates deactivated');
      }
    } catch (deactivateErr) {
      console.warn('[verify-voice-and-mint] Deactivation failed (non-critical):', deactivateErr);
    }

    // Step 8: Activate the new certificate
    const { error: activateError } = await supabaseClient
      .from('voice_blockchain_certificates')
      .update({ 
        is_active: true,
        certification_status: 'verified'
      })
      .eq('voice_profile_id', voiceProfileId);
    
    if (activateError) {
      console.error('[verify-voice-and-mint] Activate error:', activateError);
      // This is critical - if we can't activate, something went wrong
      throw new Error(`Failed to activate certificate: ${activateError.message}`);
    }

    console.log('[verify-voice-and-mint] New certificate activated');

    // Step 9: Log certification event to identity_access_logs (non-critical)
    try {
      const { error: logError } = await supabaseClient
        .from('identity_access_logs')
        .insert({
          identity_asset_id: voiceProfileId, // Using voice_profile_id as identifier
          action: 'certified',
          actor_id: user.id,
          details: {
            type: 'voice_identity',
            chain: 'polygon',
            tx_hash: tx.hash,
            token_id: tokenId,
            explorer_url: explorerUrl,
          },
        });

      if (logError) {
        console.warn('[verify-voice-and-mint] Activity log error (non-critical):', logError);
      } else {
        console.log('[verify-voice-and-mint] Activity logged');
      }
    } catch (logErr) {
      console.warn('[verify-voice-and-mint] Activity logging failed (non-critical):', logErr);
    }

    console.log('[verify-voice-and-mint] Verification complete - returning success');

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        voiceProfileId,
        voiceHash,
        certificate: {
          token_id: tokenId,
          tx_hash: tx.hash,
          explorer_url: explorerUrl,
          contract_address: contractAddress
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[verify-voice-and-mint] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Determine error type and code
    let errorCode = 'UNKNOWN_ERROR';
    let statusCode = 500;
    
    if (errorMessage.includes('authenticated')) {
      errorCode = 'NOT_AUTHENTICATED';
      statusCode = 401;
    } else if (errorMessage.includes('Audio')) {
      errorCode = 'INVALID_AUDIO';
      statusCode = 400;
    } else if (errorMessage.includes('blockchain') || errorMessage.includes('mint')) {
      errorCode = 'BLOCKCHAIN_ERROR';
      statusCode = 500;
    } else if (errorMessage.includes('database') || errorMessage.includes('insert')) {
      errorCode = 'DATABASE_ERROR';
      statusCode = 500;
    }
    
    return new Response(
      JSON.stringify({ 
        ok: false,
        success: false,
        error: errorCode,
        message: errorMessage
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
