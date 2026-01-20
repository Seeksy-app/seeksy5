import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SIGNING_SECRET = Deno.env.get('SIGNING_SECRET') || 'default-dev-secret-change-in-production';
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

interface TokenPayload {
  userId: string;
  resourceId: string;
  resourceType: 'event' | 'meeting' | 'signup';
  exp: number;
}

/**
 * Generate HMAC signature for token validation
 */
async function generateSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a signed token for public booking endpoints
 * Token expires in 24 hours by default
 */
export async function createSignedToken(
  userId: string,
  resourceId: string,
  resourceType: 'event' | 'meeting' | 'signup',
  expiresInMs: number = 24 * 60 * 60 * 1000
): Promise<string> {
  const payload: TokenPayload = {
    userId,
    resourceId,
    resourceType,
    exp: Date.now() + expiresInMs
  };
  
  const payloadStr = JSON.stringify(payload);
  const signature = await generateSignature(payloadStr);
  
  const encoder = new TextEncoder();
  const payloadBase64 = btoa(String.fromCharCode(...encoder.encode(payloadStr)));
  
  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a signed token
 * Returns null if invalid or expired
 */
export async function verifySignedToken(token: string): Promise<TokenPayload | null> {
  try {
    const [payloadBase64, providedSignature] = token.split('.');
    if (!payloadBase64 || !providedSignature) {
      return null;
    }
    
    // Decode payload
    const payloadStr = atob(payloadBase64);
    const payload: TokenPayload = JSON.parse(payloadStr);
    
    // Check expiration
    if (payload.exp < Date.now()) {
      console.warn('Token expired');
      return null;
    }
    
    // Verify signature
    const expectedSignature = await generateSignature(payloadStr);
    if (providedSignature !== expectedSignature) {
      console.warn('Invalid token signature');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Simple rate limiting using Supabase
 * Tracks requests by IP address
 */
export async function checkRateLimit(
  supabase: any,
  ip: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
    
    // Count recent requests from this IP for this endpoint
    const { count, error } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)
      .gte('created_at', new Date(windowStart).toISOString());
    
    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
    }
    
    const requestCount = count || 0;
    const allowed = requestCount < RATE_LIMIT_MAX_REQUESTS;
    
    if (allowed) {
      // Log this request
      await supabase.from('rate_limit_logs').insert({
        ip_address: ip,
        endpoint: endpoint,
        created_at: new Date().toISOString()
      });
    }
    
    return {
      allowed,
      remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - requestCount - 1)
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';
}

/**
 * Sanitize HTML to prevent XSS in email content
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
