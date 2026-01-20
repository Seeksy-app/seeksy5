import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.9.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple content certification contract ABI (just stores hash on-chain)
const CONTENT_CERT_ABI = [
  "function certifyContent(bytes32 contentHash, string memory metadata) public returns (uint256)",
  "event ContentCertified(address indexed certifier, bytes32 indexed contentHash, uint256 timestamp, string metadata)"
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

    const { content_ids } = await req.json();

    if (!content_ids || !Array.isArray(content_ids) || content_ids.length === 0) {
      throw new Error('content_ids array is required');
    }

    console.log(`Certifying ${content_ids.length} content items for user ${user.id}`);

    // Fetch content to certify
    const { data: contents, error: fetchError } = await supabaseClient
      .from("protected_content")
      .select("*")
      .eq("user_id", user.id)
      .in("id", content_ids)
      .is("blockchain_tx_hash", null);

    if (fetchError) throw fetchError;

    if (!contents || contents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, certified: 0, message: "No pending content to certify" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${contents.length} items to certify`);

    // Setup blockchain connection
    const polygonRpcUrl = Deno.env.get('POLYGON_RPC_URL');
    const privateKey = Deno.env.get('POLYGON_PRIVATE_KEY');

    if (!polygonRpcUrl || !privateKey) {
      console.error('Missing blockchain configuration');
      throw new Error('Blockchain configuration not available');
    }

    const provider = new ethers.JsonRpcProvider(polygonRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Using wallet address: ${wallet.address}`);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Wallet balance: ${ethers.formatEther(balance)} MATIC`);

    if (balance < ethers.parseEther("0.001")) {
      throw new Error('Insufficient MATIC balance for gas fees');
    }

    const results = [];

    for (const content of contents) {
      try {
        // Generate certificate data
        const certificateData = {
          contentId: content.id,
          title: content.title,
          contentType: content.content_type,
          fileHash: content.file_hash,
          originalUrl: content.original_file_url,
          creatorId: user.id,
          timestamp: new Date().toISOString(),
        };

        // Create certificate hash
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(certificateData));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const certificateHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        console.log(`Creating on-chain certificate for content ${content.id}`);
        console.log(`Certificate hash: ${certificateHash}`);

        // Create a simple data transaction to store the hash on-chain
        // This writes the hash directly to the blockchain as transaction data
        const metadataString = JSON.stringify({
          type: 'content_certification',
          platform: 'seeksy',
          contentId: content.id,
          title: content.title,
          contentType: content.content_type,
          fileHash: content.file_hash,
          certifiedAt: new Date().toISOString(),
        });

        // Encode metadata as hex for transaction data
        const metadataHex = '0x' + Array.from(new TextEncoder().encode(metadataString))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Send transaction with embedded data
        const tx = await wallet.sendTransaction({
          to: wallet.address, // Self-send with data
          value: 0,
          data: metadataHex,
        });

        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);

        const txHash = tx.hash;
        const certificateUrl = `https://polygonscan.com/tx/${txHash}`;

        console.log(`Certified content ${content.id}: ${txHash}`);

        // Update the content record
        const { error: updateError } = await supabaseClient
          .from("protected_content")
          .update({
            blockchain_tx_hash: txHash,
            blockchain_certificate_url: certificateUrl,
            proof_status: 'verified',
            updated_at: new Date().toISOString(),
          })
          .eq("id", content.id);

        if (updateError) {
          console.error(`Failed to update content ${content.id}:`, updateError);
          results.push({ id: content.id, success: false, error: updateError.message });
        } else {
          results.push({ 
            id: content.id, 
            success: true, 
            txHash, 
            certificateUrl,
            certificateHash,
            blockNumber: receipt?.blockNumber,
          });
        }
      } catch (itemError) {
        console.error(`Error certifying content ${content.id}:`, itemError);
        results.push({ 
          id: content.id, 
          success: false, 
          error: itemError instanceof Error ? itemError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Certification complete: ${successCount}/${contents.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        certified: successCount,
        total: contents.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in certify-protected-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
