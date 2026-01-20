import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMyPageEnabled = () => {
  return useQuery({
    queryKey: ['my-page-enabled'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('my_page_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching My Page status:', error);
        return true; // Default to enabled on error
      }

      // Default to true if no preference set (for existing users)
      return data?.my_page_enabled !== false;
    },
  });
};
