/**
 * Route validation utility for installed modules.
 * 
 * This utility validates that module routes exist in the application
 * and provides fallback handling for missing routes.
 * 
 * IMPORTANT: This prevents "Profile Not Found" errors by redirecting
 * to a friendly Coming Soon page for unimplemented routes.
 */

import { SEEKSY_MODULES, type SeeksyModule } from '@/components/modules/moduleData';
import { logRouteValidation } from './onboardingDebug';

// Known valid routes in the application
// This list is derived from App.tsx route definitions
const VALID_ROUTES: Set<string> = new Set([
  // Core
  '/my-day',
  '/my-work',
  '/recents',
  '/settings',
  '/apps',
  '/modules',
  '/module-center',
  '/coming-soon',
  
  // Creator Studio
  '/studio',
  '/clips',
  '/studio/ai-post-production',
  '/studio/media',
  '/studio/editor',
  '/voice-cloning',
  
  // Podcasting
  '/podcasts',
  
  // Campaigns & Marketing
  '/marketing/campaigns',
  '/marketing/templates',
  '/marketing/segments',
  '/email/inbox',
  '/newsletter',
  '/sms',
  '/marketing/automations',
  '/my-blog',
  
  // Events
  '/events',
  '/creator/meetings',
  '/forms',
  '/polls',
  '/awards',
  
  // CRM & Business
  '/crm',
  '/audience',
  '/project-management',
  '/tasks',
  '/proposals',
  '/deals',
  
  // Identity
  '/profile/edit',
  '/identity',
  '/broadcast-monitoring',
  
  // AI Tools
  '/spark',
  '/automations/ai',
  
  // Analytics
  '/social-analytics',
]);

// Routes that are known to be missing and should show "Coming Soon"
const COMING_SOON_ROUTES: Set<string> = new Set([
  '/deals',
  '/broadcast-monitoring',
  '/automations/ai',
]);

export interface RouteValidationResult {
  isValid: boolean;
  isMissing: boolean;
  isComingSoon: boolean;
  suggestedRoute?: string;
}

/**
 * Validate if a module's route exists in the application.
 */
export function validateModuleRoute(moduleId: string, route?: string): RouteValidationResult {
  if (!route) {
    return {
      isValid: false,
      isMissing: true,
      isComingSoon: false,
    };
  }

  // Check if route is in our known valid routes
  const isValid = VALID_ROUTES.has(route);
  const isComingSoon = COMING_SOON_ROUTES.has(route);

  if (!isValid) {
    console.warn(`[RouteValidation] Module "${moduleId}" has invalid route: ${route}`);
  }

  return {
    isValid,
    isMissing: !isValid && !isComingSoon,
    isComingSoon,
  };
}

/**
 * Get a safe route for a module - returns the route if valid,
 * or redirects to coming-soon if the route is missing.
 * 
 * This function NEVER crashes and ALWAYS returns a valid route.
 */
export function getSafeModuleRoute(moduleId: string, route?: string): string {
  try {
    const validation = validateModuleRoute(moduleId, route);
    
    if (validation.isValid) {
      logRouteValidation({
        moduleId,
        requestedRoute: route || 'undefined',
        isValid: true,
      });
      return route!;
    }
    
    // For coming soon or invalid routes, redirect to coming-soon page
    const fallbackRoute = `/coming-soon?module=${moduleId}`;
    
    logRouteValidation({
      moduleId,
      requestedRoute: route || 'undefined',
      isValid: false,
      redirectTo: fallbackRoute,
    });
    
    console.warn(`[Seeksy Debug] Route validation failed for "${moduleId}": "${route}" → redirecting to coming-soon`);
    return fallbackRoute;
  } catch (err) {
    // Failsafe: never crash, always return a valid route
    console.error('[Seeksy Debug] Route validation error:', err);
    return `/coming-soon?module=${moduleId}`;
  }
}

/**
 * Audit all module routes and log any issues.
 * Call this during development to identify route mismatches.
 */
export function auditModuleRoutes(): {
  valid: SeeksyModule[];
  invalid: SeeksyModule[];
  comingSoon: SeeksyModule[];
} {
  const valid: SeeksyModule[] = [];
  const invalid: SeeksyModule[] = [];
  const comingSoon: SeeksyModule[] = [];

  for (const module of SEEKSY_MODULES) {
    if (!module.route) {
      invalid.push(module);
      continue;
    }

    const validation = validateModuleRoute(module.id, module.route);
    
    if (validation.isValid) {
      valid.push(module);
    } else if (validation.isComingSoon) {
      comingSoon.push(module);
    } else {
      invalid.push(module);
    }
  }

  // Log summary in development
  if (process.env.NODE_ENV === 'development') {
    console.group('[RouteValidation] Module Route Audit');
    console.log(`✓ Valid routes: ${valid.length}`);
    console.log(`⏳ Coming soon: ${comingSoon.length}`, comingSoon.map(m => m.id));
    console.log(`✗ Invalid routes: ${invalid.length}`, invalid.map(m => ({ id: m.id, route: m.route })));
    console.groupEnd();
  }

  return { valid, invalid, comingSoon };
}

/**
 * Get module info by ID.
 */
export function getModuleById(moduleId: string): SeeksyModule | undefined {
  return SEEKSY_MODULES.find(m => m.id === moduleId);
}

/**
 * Check if a module has a valid, navigable route.
 */
export function moduleHasValidRoute(moduleId: string): boolean {
  const module = getModuleById(moduleId);
  if (!module?.route) return false;
  
  const validation = validateModuleRoute(moduleId, module.route);
  return validation.isValid;
}
