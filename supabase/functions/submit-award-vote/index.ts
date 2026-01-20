import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { programId, nomineeId, categoryId, voterEmail, voterName } = await req.json();

    // Get program settings
    const { data: program } = await supabase
      .from('awards_programs')
      .select('*, award_categories(*)')
      .eq('id', programId)
      .single();

    if (!program) {
      throw new Error('Program not found');
    }

    // Check if voting is open
    const now = new Date();
    const votingOpen = program.voting_open_date ? new Date(program.voting_open_date) : null;
    const votingClose = program.voting_close_date ? new Date(program.voting_close_date) : null;

    if (votingOpen && now < votingOpen) {
      throw new Error('Voting has not opened yet');
    }
    if (votingClose && now > votingClose) {
      throw new Error('Voting has closed');
    }

    // Get auth user if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Create voter identifier hash (IP + user agent for anonymous, userId for authenticated)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const voterIdentifier = userId || `${clientIp}-${userAgent}`;
    
    // Simple hash function using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(voterIdentifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const voterHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if registration is required
    if (program.require_voter_registration && !userId) {
      throw new Error('You must be registered to vote in this program');
    }

    // Check max votes per voter
    if (program.max_votes_per_voter) {
      const { count } = await supabase
        .from('award_votes')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId)
        .or(`voter_id.eq.${userId},voter_ip_hash.eq.${voterHash}`);

      if (count && count >= program.max_votes_per_voter) {
        throw new Error(`Maximum ${program.max_votes_per_voter} votes allowed per voter`);
      }
    }

    // Check if already voted for this nominee in this category
    const { count: existingVotes } = await supabase
      .from('award_votes')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .eq('category_id', categoryId)
      .eq('nominee_id', nomineeId)
      .or(`voter_id.eq.${userId},voter_ip_hash.eq.${voterHash}`);

    if (existingVotes && existingVotes > 0) {
      throw new Error('You have already voted for this nominee');
    }

    // Submit vote
    const { error: voteError } = await supabase
      .from('award_votes')
      .insert({
        program_id: programId,
        category_id: categoryId,
        nominee_id: nomineeId,
        voter_id: userId,
        voter_ip_hash: userId ? null : voterHash,
        voter_email: voterEmail || null,
        voter_name: voterName || null,
        vote_weight: 1.0,
      });

    if (voteError) throw voteError;

    // Update nominee total votes
    const { data: voteCount } = await supabase
      .from('award_votes')
      .select('*', { count: 'exact', head: true })
      .eq('nominee_id', nomineeId);

    await supabase
      .from('award_nominees')
      .update({ total_votes: voteCount || 0 })
      .eq('id', nomineeId);

    console.log(`Vote recorded for nominee ${nomineeId} in program ${programId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Vote recorded successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Vote submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
