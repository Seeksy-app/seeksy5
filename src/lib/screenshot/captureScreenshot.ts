import { supabase } from "@/integrations/supabase/client";

export interface CaptureScreenshotParams {
  url: string;
  pageName: string;
  category: 'advertiser-tools' | 'creator-tools' | 'internal' | 'external' | 'onboarding';
  description?: string;
}

export interface CaptureScreenshotResult {
  id: string;
  page_name: string;
  url: string;
  category: string;
  screenshot_path: string;
  public_url: string;
  created_at: string;
}

export interface HealthCheckResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  status?: number;
  rawError?: string;
  elapsed?: string;
  imageSize?: string;
}

// Map error codes to user-friendly toast messages
function mapErrorCodeToMessage(code: string, fallbackMessage: string): string {
  switch (code) {
    case 'AUTH_ERROR':
      return 'Invalid ScreenshotOne API key or access denied.';
    case 'RATE_LIMIT':
      return 'Rate limit reached, try again later.';
    case 'PROVIDER_ERROR':
      return 'Screenshot provider is temporarily unavailable.';
    case 'MISSING_API_KEY':
      return 'ScreenshotOne API key not configured in secrets.';
    case 'STORAGE_ERROR':
      return 'Failed to upload screenshot to storage.';
    case 'DATABASE_ERROR':
      return 'Failed to save screenshot metadata.';
    case 'UNAUTHORIZED':
      return 'You must be logged in to capture screenshots.';
    case 'FORBIDDEN':
      return 'Admin access required for screenshots.';
    default:
      return fallbackMessage;
  }
}

/**
 * Run a health check on the ScreenshotOne API
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log('[captureScreenshot] Running health check...');
  
  // First verify we have an active session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('[captureScreenshot] No active session for health check:', sessionError?.message);
    return {
      success: false,
      error: 'You must be logged in to run the health check. Please refresh the page and try again.',
      code: 'NO_SESSION',
    };
  }
  
  console.log('[captureScreenshot] Session found, invoking edge function...');
  
  const { data, error } = await supabase.functions.invoke('capture-screenshot', {
    body: { healthCheck: true },
  });

  if (error) {
    console.error('[captureScreenshot] Health check edge function error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to screenshot service',
      code: 'EDGE_FUNCTION_ERROR',
    };
  }

  console.log('[captureScreenshot] Health check result:', data);
  return data as HealthCheckResult;
}

/**
 * Capture a screenshot using the Screenshot API service
 */
export async function captureScreenshot({
  url,
  pageName,
  category,
  description,
}: CaptureScreenshotParams): Promise<CaptureScreenshotResult> {
  console.log('[captureScreenshot] Starting capture for:', url, pageName);
  
  // First verify we have an active session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('[captureScreenshot] No active session:', sessionError?.message);
    throw new Error('You must be logged in to capture screenshots. Please refresh the page and try again.');
  }
  
  const { data, error } = await supabase.functions.invoke('capture-screenshot', {
    body: {
      url,
      pageName,
      category,
      description,
    },
  });

  if (error) {
    console.error('[captureScreenshot] Edge function error:', {
      message: error.message,
      name: error.name,
      context: error.context,
      status: error.status,
    });
    
    const errorMsg = error.message || 'Failed to capture screenshot';
    throw new Error(`Screenshot failed: ${errorMsg}`);
  }

  if (!data?.success) {
    const errorCode = data?.code || 'UNKNOWN_ERROR';
    const errorDetail = data?.error || 'Unknown error from screenshot service';
    const userMessage = mapErrorCodeToMessage(errorCode, errorDetail);
    console.error('[captureScreenshot] API returned failure:', { code: errorCode, error: errorDetail });
    throw new Error(userMessage);
  }

  console.log('[captureScreenshot] Success:', data.screenshot?.page_name);
  return data.screenshot;
}

/**
 * Fetch all screenshots from the database
 */
export async function fetchScreenshots(category?: string) {
  let query = supabase
    .from('ui_screenshots')
    .select('*')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fetch screenshots error:', error);
    throw new Error(error.message || 'Failed to fetch screenshots');
  }

  return data.map(screenshot => {
    const metadata = screenshot.metadata as { public_url?: string } | null;
    return {
      ...screenshot,
      public_url: metadata?.public_url || '',
    };
  });
}

/**
 * Delete a screenshot from both storage and database
 */
export async function deleteScreenshot(id: string, screenshotPath: string) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('ui-screenshots')
    .remove([screenshotPath]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    throw new Error(storageError.message || 'Failed to delete from storage');
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('ui_screenshots')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Database delete error:', dbError);
    throw new Error(dbError.message || 'Failed to delete from database');
  }
}