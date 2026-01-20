import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Mint Identity Certificate
 * 
 * Auto-certifies face_identity and voice_identity assets on Polygon blockchain.
 * Similar pattern to clip certification but for identity assets.
 * 
 * Supports:
 * 1. Automatic (service role): Called when identity assets are uploaded
 * 2. Manual (user): Called by creators to certify existing identity
 * 
 * Logs all actions to identity_access_logs
 */

const CERTIFICATE_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "clipId", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ClipCertified",
    "type": "event"
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

interface MintIdentityRequest {
  identityAssetId: string;
  chain?: 'polygon' | 'base' | 'ethereum';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== MINT IDENTITY CERTIFICATE ===");

    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isServiceRole = authHeader?.includes(serviceRoleKey || "");

    console.log(`→ Call type: ${isServiceRole ? 'SERVICE_ROLE (automatic)' : 'USER (manual)'}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      isServiceRole 
        ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        : Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    let userId: string | null = null;
    if (!isServiceRole) {
      if (!authHeader) throw new Error("Not authenticated");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User authentication failed");
      userId = user.id;
      console.log(`→ Authenticated user: ${userId}`);
    }

    const requestData: MintIdentityRequest = await req.json();
    const { identityAssetId, chain = 'polygon' } = requestData;

    console.log(`→ Certifying identity asset: ${identityAssetId} on ${chain}`);

    // Get identity asset
    const assetQuery = supabase
      .from('identity_assets')
      .select('*')
      .eq('id', identityAssetId);
    
    if (userId) {
      assetQuery.eq('user_id', userId);
    }

    const { data: asset, error: assetError } = await assetQuery.single();

    if (assetError || !asset) {
      throw new Error("Identity asset not found or access denied");
    }

    console.log(`✓ Found ${asset.type} owned by user: ${asset.user_id}`);

    // Check if already certified
    if (asset.cert_status === 'minted') {
      console.log("✓ Identity already certified, returning existing certificate");
      return new Response(
        JSON.stringify({
          success: true,
          alreadyCertified: true,
          asset,
          certificate: {
            chain: asset.cert_chain,
            tx_hash: asset.cert_tx_hash,
            token_id: asset.cert_token_id,
            explorer_url: asset.cert_explorer_url,
          },
          message: "Identity already has a valid certificate",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prevent duplicate minting
    if (asset.cert_status === 'minting') {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Certification already in progress",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Set status to minting
    await supabase
      .from('identity_assets')
      .update({ 
        cert_status: 'minting',
        cert_updated_at: new Date().toISOString(),
      })
      .eq('id', identityAssetId);

    console.log("→ Minting on-chain certificate on Polygon mainnet...");

    // Blockchain integration
    const rpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const minterPrivateKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    const contractAddress = "0xB5627bDbA3ab392782E7E542a972013E3e7F37C3";

    console.log('[Mint] RPC URL:', rpcUrl);
    console.log('[Mint] CONTRACT ADDRESS:', contractAddress);

    if (!rpcUrl || !minterPrivateKey) {
      throw new Error("Missing blockchain configuration");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Ensure private key has 0x prefix for ethers.js
    const formattedPrivateKey = minterPrivateKey.startsWith('0x') 
      ? minterPrivateKey 
      : `0x${minterPrivateKey}`;
    
    console.log('[Mint] PRIVATE KEY LENGTH:', formattedPrivateKey?.length);
    console.log('[Mint] PRIVATE KEY PREFIX:', formattedPrivateKey?.substring(0, 2));
    
    const signer = new ethers.Wallet(formattedPrivateKey, provider);
    
    console.log(`→ Platform wallet: ${signer.address}`);

    // Validate contract address
    try {
      const checksummed = ethers.getAddress(contractAddress);
      console.log('[Mint] Checksummed contract address:', checksummed);
    } catch (e) {
      console.error('[Mint] INVALID CONTRACT ADDRESS', e);
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }

    const contract = new ethers.Contract(
      contractAddress,
      CERTIFICATE_CONTRACT_ABI,
      signer
    );

    try {
      const creatorAddress = signer.address;
      
      console.log(`→ Certifying ${asset.type} for creator: ${creatorAddress}`);

      let tx;
      try {
        tx = await contract.certifyClip(creatorAddress, asset.id);
        console.log('[Mint] TX sent:', tx.hash);
      } catch (err) {
        console.error('[Mint] Transaction error:', err);
        throw new Error(`Blockchain transaction failed: ${err}`);
      }
      
      console.log(`→ Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);

      let certTimestamp = Date.now().toString();
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed && parsed.name === "ClipCertified") {
            certTimestamp = parsed.args.timestamp.toString();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      const tokenId = certTimestamp;
      const explorerUrls: Record<string, string> = {
        polygon: `https://polygonscan.com/tx/${tx.hash}`,
        base: `https://basescan.org/tx/${tx.hash}`,
        ethereum: `https://etherscan.io/tx/${tx.hash}`,
      };

      // Update asset with certificate
      const { data: certifiedAsset, error: certError } = await supabase
        .from('identity_assets')
        .update({
          cert_status: 'minted',
          cert_chain: chain,
          cert_tx_hash: tx.hash,
          cert_token_id: tokenId,
          cert_explorer_url: explorerUrls[chain],
          cert_created_at: new Date().toISOString(),
          cert_updated_at: new Date().toISOString(),
        })
        .eq('id', identityAssetId)
        .select()
        .single();

      if (certError) {
        await supabase
          .from('identity_assets')
          .update({ cert_status: 'failed', cert_updated_at: new Date().toISOString() })
          .eq('id', identityAssetId);
        throw certError;
      }

      // Log certification event
      await supabase.from('identity_access_logs').insert({
        identity_asset_id: identityAssetId,
        action: 'certified',
        actor_id: asset.user_id,
        details: {
          chain,
          tx_hash: tx.hash,
          token_id: tokenId,
          type: asset.type,
        },
      });

      console.log("✓ Identity certified on-chain");

      return new Response(
        JSON.stringify({
          success: true,
          asset: certifiedAsset,
          certificate: {
            chain,
            tx_hash: tx.hash,
            token_id: tokenId,
            explorer_url: explorerUrls[chain],
            contract_address: contractAddress,
          },
          message: `${asset.type} certified on blockchain`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (blockchainError) {
      console.error("❌ Blockchain minting failed:", blockchainError);
      
      await supabase
        .from('identity_assets')
        .update({ cert_status: 'failed', cert_updated_at: new Date().toISOString() })
        .eq('id', identityAssetId);
      
      throw new Error(`Blockchain minting failed: ${blockchainError}`);
    }

  } catch (error) {
    console.error("❌ Certificate minting error:", error);
    
    // Determine error stage and code
    let stage: string = "unknown";
    let code: string = "UNKNOWN_ERROR";
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("private key") || errorMsg.includes("INVALID_ARGUMENT")) {
      stage = "blockchain_config";
      code = "INVALID_PRIVATE_KEY";
    } else if (errorMsg.includes("Identity asset not found")) {
      stage = "db";
      code = "ASSET_NOT_FOUND";
    } else if (errorMsg.includes("already in progress")) {
      stage = "db";
      code = "DUPLICATE_MINT";
    } else if (errorMsg.includes("transaction") || errorMsg.includes("revert")) {
      stage = "mint";
      code = "BLOCKCHAIN_TX_FAILED";
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        stage,
        code,
        error: errorMsg,
        message: `Minting failed at ${stage}: ${errorMsg}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});