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

    const url = new URL(req.url);
    const programId = url.searchParams.get('programId');

    if (!programId) {
      throw new Error('Program ID required');
    }

    // Get program settings
    const { data: program } = await supabase
      .from('awards_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (!program) {
      throw new Error('Program not found');
    }

    // Check if user is admin or if live results are enabled
    const authHeader = req.headers.get('Authorization');
    let isAdmin = false;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        isAdmin = userRole?.role === 'admin' || userRole?.role === 'super_admin';
      }
    }

    // If not admin and live results not enabled, deny access
    if (!isAdmin && !program.show_live_results) {
      return new Response(
        JSON.stringify({ error: 'Results not available yet' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Get all categories with nominees and vote counts
    const { data: categories } = await supabase
      .from('award_categories')
      .select(`
        *,
        award_nominees (
          *,
          award_votes (count)
        )
      `)
      .eq('program_id', programId)
      .order('display_order', { ascending: true });

    // Calculate vote totals and rankings
    const results = categories?.map(category => ({
      ...category,
      nominees: category.award_nominees
        .map((nominee: any) => ({
          ...nominee,
          voteCount: nominee.total_votes || 0,
        }))
        .sort((a: any, b: any) => b.voteCount - a.voteCount),
    }));

    // Get overall statistics
    const { count: totalVotes } = await supabase
      .from('award_votes')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId);

    const { count: totalNominees } = await supabase
      .from('award_nominees')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId);

    return new Response(
      JSON.stringify({
        success: true,
        program: {
          id: program.id,
          title: program.title,
          showLiveResults: program.show_live_results,
        },
        statistics: {
          totalVotes: totalVotes || 0,
          totalNominees: totalNominees || 0,
          totalCategories: categories?.length || 0,
        },
        categories: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Get results error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
