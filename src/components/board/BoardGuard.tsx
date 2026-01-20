import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useBoardViewMode } from '@/hooks/useBoardViewMode';

interface BoardGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that redirects board_member users to /board
 * unless they're already on a board route.
 * 
 * Also handles super admin "board view" mode.
 */
export function BoardGuard({ children }: BoardGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isBoardMember, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { isViewingAsBoard, isLoading: viewModeLoading } = useBoardViewMode();

  const isBoardRoute = location.pathname.startsWith('/board');
  const isPublicRoute = ['/auth', '/', '/privacy', '/terms', '/cookies', '/security'].includes(location.pathname) ||
    location.pathname.startsWith('/c/') ||
    location.pathname.startsWith('/v/') ||
    location.pathname.startsWith('/p/');

  useEffect(() => {
    // Don't redirect while loading, but board routes render immediately regardless
    if (rolesLoading || viewModeLoading) return;
    if (isPublicRoute) return;
    // Board routes don't need any redirect logic - they just render
    if (isBoardRoute) return;

    console.log('[BoardGuard] Role check:', { isBoardMember, isAdmin, isViewingAsBoard, path: location.pathname });

    // If user is a board member (not admin), redirect to /board
    if (isBoardMember && !isAdmin) {
      console.log('[BoardGuard] Redirecting board_member to /board');
      navigate('/board', { replace: true });
      return;
    }

    // If admin is viewing as board, redirect to /board (unless already there)
    if (isAdmin && isViewingAsBoard) {
      navigate('/board', { replace: true });
      return;
    }
  }, [isBoardMember, isAdmin, isViewingAsBoard, isBoardRoute, isPublicRoute, navigate, rolesLoading, viewModeLoading]);

  // Board routes render immediately without waiting for role checks
  return <>{children}</>;
}
