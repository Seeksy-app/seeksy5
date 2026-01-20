/**
 * Token encryption utilities for OAuth tokens.
 * 
 * IMPORTANT: This is a client-side placeholder. Actual encryption/decryption
 * should happen server-side in edge functions using environment secrets.
 * 
 * The encryption key should NEVER be exposed to the frontend.
 */

// This constant indicates that a token is encrypted
export const ENCRYPTED_TOKEN_PREFIX = "enc_v1_";

/**
 * Check if a token value is encrypted
 */
export function isTokenEncrypted(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith(ENCRYPTED_TOKEN_PREFIX);
}

/**
 * Mask a token for display purposes
 * Shows first 4 and last 4 characters with dots in between
 */
export function maskToken(token: string | null | undefined): string {
  if (!token) return "••••••••";
  if (token.length <= 12) return "••••••••";
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}

/**
 * List of tables that store OAuth tokens and need encryption
 * This serves as documentation and can be used for migration tracking
 */
export const OAUTH_TOKEN_TABLES = [
  {
    table: "email_accounts",
    columns: ["access_token", "refresh_token"],
    priority: "high",
    migrated: false,
  },
  {
    table: "gmail_connections",
    columns: ["access_token", "refresh_token"],
    priority: "high",
    migrated: false,
  },
  {
    table: "social_media_profiles",
    columns: ["access_token", "refresh_token"],
    priority: "medium",
    migrated: false,
  },
  {
    table: "zoom_connections",
    columns: ["access_token", "refresh_token"],
    priority: "medium",
    migrated: false,
  },
  {
    table: "microsoft_connections",
    columns: ["access_token", "refresh_token"],
    priority: "medium",
    migrated: false,
  },
  {
    table: "calendar_connections",
    columns: ["access_token", "refresh_token"],
    priority: "medium",
    migrated: false,
  },
  {
    table: "meta_integrations",
    columns: ["access_token"],
    priority: "medium",
    migrated: false,
  },
  {
    table: "youtube_oauth_sessions",
    columns: ["access_token", "refresh_token"],
    priority: "low",
    migrated: false,
  },
  {
    table: "external_platform_accounts",
    columns: ["access_token", "refresh_token"],
    priority: "low",
    migrated: false,
  },
  // Already encrypted (good pattern to follow)
  {
    table: "streaming_destinations",
    columns: ["access_token_encrypted"],
    priority: "none",
    migrated: true,
  },
] as const;
