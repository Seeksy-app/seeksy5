import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ROOT_ROUTES = ['/', '/creator', '/home'];

export function useDefaultLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only redirect on root routes, not deep links
    if (!ROOT_ROUTES.includes(location.pathname)) {
      setChecked(true);
      return;
    }

    const checkDefaultLanding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setChecked(true);
          return;
        }

        // Check user role FIRST - admin/board users have fixed landing routes
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin') || false;
        const isBoardMember = roles?.some(r => r.role === 'board_member') || false;
        const isAdvertiser = roles?.some(r => r.role === 'advertiser') || false;

        // Admin users always go to /admin - never use workspace context
        if (isAdmin) {
          navigate('/admin', { replace: true });
          setChecked(true);
          return;
        }

        // Board members always go to /board
        if (isBoardMember) {
          navigate('/board', { replace: true });
          setChecked(true);
          return;
        }

        // Advertisers always go to /advertiser
        if (isAdvertiser) {
          navigate('/advertiser', { replace: true });
          setChecked(true);
          return;
        }

        // For creators/regular users, use their preference
        const { data } = await supabase
          .from('user_preferences')
          .select('default_landing_route')
          .eq('user_id', user.id)
          .single();

        const defaultRoute = data?.default_landing_route || '/my-day';
        
        // Navigate to the default landing route
        if (location.pathname !== defaultRoute) {
          navigate(defaultRoute, { replace: true });
        }
      } catch (err) {
        console.error('Error checking default landing:', err);
        // Default to My Day on error for creators
        navigate('/my-day', { replace: true });
      } finally {
        setChecked(true);
      }
    };

    checkDefaultLanding();
  }, [location.pathname, navigate]);

  return { checked };
}
