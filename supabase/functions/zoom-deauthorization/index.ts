import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Zoom deauthorization request:', payload);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete the Zoom connection when user deauthorizes
    if (payload.user_id) {
      const { error } = await supabaseAdmin
        .from('zoom_connections')
        .delete()
        .eq('zoom_user_id', payload.user_id);

      if (error) {
        console.error('Error deleting Zoom connection:', error);
      } else {
        console.log('Successfully deauthorized Zoom user:', payload.user_id);
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error in zoom-deauthorization:', error);
    return new Response(null, { status: 200 }); // Always return 200 to Zoom
  }
});
