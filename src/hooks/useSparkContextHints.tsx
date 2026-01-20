/**
 * useSparkContextHints Hook
 * Provides context-aware Spark hints based on current route and user role
 */

import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getSparkContextHint, type UserRole, type PageContext } from "@/lib/spark/sparkPersonality";
import { useRole } from "@/contexts/RoleContext";

export const useSparkContextHints = () => {
  const location = useLocation();
  const { currentRole } = useRole();

  const context: PageContext = useMemo(() => {
    const path = location.pathname;

    if (path === "/" || path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/podcast")) return "podcast";
    if (path.startsWith("/studio")) return "studio";
    if (path.startsWith("/my-page") || path.startsWith("/profile/edit")) return "my-page";
    if (path.startsWith("/advertiser/campaign") || path.startsWith("/campaigns")) return "campaign";
    if (path.startsWith("/admin/sales/rate-desk")) return "rate-desk";
    if (path.startsWith("/cfo-dashboard")) return "cfo-dashboard";
    if (path.startsWith("/admin/financial-models")) return "financial-models";
    if (path.startsWith("/voice")) return "voice-certification";
    if (path.startsWith("/media")) return "media-library";
    if (path.startsWith("/meetings")) return "meetings";
    if (path.startsWith("/blog")) return "blog";
    if (path.startsWith("/settings")) return "settings";
    
    return "general";
  }, [location.pathname]);

  const role: UserRole = useMemo(() => {
    const roleStr = String(currentRole || "");
    if (roleStr === "admin" || roleStr === "super_admin") return "admin";
    if (roleStr === "advertiser") return "advertiser";
    if (roleStr === "creator") return "creator";
    return "guest";
  }, [currentRole]);

  const hint = useMemo(() => {
    return getSparkContextHint(context, role);
  }, [context, role]);

  return {
    context,
    role,
    hint,
    hasHint: hint !== null
  };
};
