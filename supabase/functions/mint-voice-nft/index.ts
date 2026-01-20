import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice Certificate Contract ABI (Deployed on Polygon mainnet)
const VOICE_CERTIFICATE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "string", "name": "voiceHash", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "mintVoiceCertificate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

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

    const { voiceProfileId, voiceFingerprint, metadata } = await req.json();

    if (!voiceProfileId || !voiceFingerprint) {
      throw new Error('Missing required fields: voiceProfileId, voiceFingerprint');
    }

    console.log('[mint-voice-nft] Starting certification for profile:', voiceProfileId);
    console.log('[mint-voice-nft] Voice fingerprint length:', voiceFingerprint?.length);

    // Check environment variables
    const rpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const privateKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    
    console.log('[mint-voice-nft] Environment check:', {
      hasRpcUrl: !!rpcUrl,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length
    });

    if (!rpcUrl || !privateKey) {
      throw new Error("Missing blockchain configuration: POLYGON_RPC_URL or POLYGON_PRIVATE_KEY");
    }

    // Create or get voice profile FIRST (required for foreign key)
    const { data: voiceProfile, error: profileError } = await supabaseClient
      .from('creator_voice_profiles')
      .upsert({
        id: voiceProfileId,
        user_id: user.id,
        voice_name: metadata?.voiceName || 'My Voice'
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError && profileError.code !== '23505') { // 23505 = unique violation (already exists)
      console.error('[mint-voice-nft] Profile creation error:', profileError);
      throw new Error(`Failed to create voice profile: ${profileError.message}`);
    }

    console.log('[mint-voice-nft] Voice profile ready:', voiceProfile?.id || voiceProfileId);

    // Check if certificate already exists
    const { data: existing } = await supabaseClient
      .from('voice_blockchain_certificates')
      .select('id, certification_status')
      .eq('voice_profile_id', voiceProfileId)
      .eq('creator_id', user.id)
      .maybeSingle();

    if (existing && existing.certification_status === 'verified') {
      throw new Error('Voice already certified on-chain');
    }

    // Set minting status
    if (existing) {
      await supabaseClient
        .from('voice_blockchain_certificates')
        .update({ certification_status: 'minting' })
        .eq('id', existing.id);
    }

    console.log('[mint-voice-nft] Minting on-chain certificate on Polygon mainnet...');

    // Blockchain integration
    const contractAddress = "0xB5627bDbA3ab392782E7E542a972013E3e7F37C3";
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, VOICE_CERTIFICATE_ABI, wallet);

    console.log('[mint-voice-nft] Wallet address:', wallet.address);

    // Prepare NFT metadata
    const nftMetadata = {
      name: metadata?.voiceName || 'Voice Profile',
      description: metadata?.description || 'Creator voice profile certified on Polygon',
      voice_fingerprint: voiceFingerprint,
      creator_id: user.id,
      profile_id: voiceProfileId,
      recording_date: metadata?.recordingDate || new Date().toISOString(),
      certification_date: new Date().toISOString(),
      usage_terms: metadata?.usageTerms || 'Standard licensing',
      attributes: [
        {
          trait_type: 'Voice Type',
          value: metadata?.voiceType || 'Professional'
        },
        {
          trait_type: 'Duration',
          value: metadata?.duration || 'N/A'
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

    console.log('[mint-voice-nft] Metadata URI generated:', metadataUri);

    // Mint on blockchain
    try {
      const tx = await contract.mintVoiceCertificate(
        wallet.address,
        voiceFingerprint,
        metadataUri
      );

      console.log('[mint-voice-nft] Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('[mint-voice-nft] Transaction confirmed in block:', receipt.blockNumber);

      // Generate token ID from timestamp
      const tokenId = Date.now().toString();

      // Build explorer URL (Polygon mainnet)
      const explorerUrl = `https://polygonscan.com/tx/${tx.hash}`;

      // Create or update blockchain certificate
      const certificateData = {
        voice_profile_id: voiceProfileId,
        creator_id: user.id,
        voice_fingerprint_hash: voiceFingerprint,
        token_id: tokenId,
        transaction_hash: tx.hash,
        metadata_uri: metadataUri,
        nft_metadata: nftMetadata,
        certification_status: 'verified',
        gas_sponsored: false,
        contract_address: contractAddress,
        cert_explorer_url: explorerUrl
      };

      let certificate;

      if (existing) {
        // Update existing
        const { data: updated, error: updateError } = await supabaseClient
          .from('voice_blockchain_certificates')
          .update(certificateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('[mint-voice-nft] Update error:', updateError);
          throw updateError;
        }
        certificate = updated;
      } else {
        // Create new
        const { data: created, error: createError } = await supabaseClient
          .from('voice_blockchain_certificates')
          .insert(certificateData)
          .select()
          .single();

        if (createError) {
          console.error('[mint-voice-nft] Insert error:', createError);
          throw createError;
        }
        certificate = created;
      }

      return new Response(
        JSON.stringify({
          success: true,
          certificate,
          transactionHash: tx.hash,
          tokenId,
          metadataUri,
          explorerUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } catch (blockchainError) {
      console.error('[mint-voice-nft] Blockchain error:', blockchainError);
      
      // Update status to failed
      if (existing) {
        await supabaseClient
          .from('voice_blockchain_certificates')
          .update({ certification_status: 'failed' })
          .eq('id', existing.id);
      }

      const errorMsg = blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error';
      throw new Error(`Blockchain minting failed: ${errorMsg}`);
    }

  } catch (error) {
    console.error('[mint-voice-nft] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error };
    
    console.error('[mint-voice-nft] Full error details:', errorDetails);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
