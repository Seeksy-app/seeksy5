import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Domain-based routing configuration (trucking removed)
const DOMAIN_ROUTES: Record<string, string> = {};

// Routes that should NOT redirect
const ALLOWED_ROUTES = [
  "/auth", // Allow auth on any domain
  "/admin", // Allow admin access
];

export function DomainRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const targetRoute = DOMAIN_ROUTES[hostname];

    if (targetRoute) {
      const currentPath = location.pathname;

      // Check if user is already on an allowed route
      const isAllowedRoute = ALLOWED_ROUTES.some(
        (route) => currentPath.startsWith(route)
      );

      // If not on an allowed route, redirect to the domain's target
      if (!isAllowedRoute && currentPath !== targetRoute) {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}
