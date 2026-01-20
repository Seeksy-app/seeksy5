/**
 * Server-side token encryption utilities for OAuth tokens.
 * Uses AES-256-GCM encryption with a key from environment secrets.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits for GCM
const ENCRYPTED_PREFIX = "enc_v1_";

/**
 * Get the encryption key from environment
 * The key should be a 256-bit (32 byte) base64-encoded string
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  
  if (!keyString) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }

  // Decode base64 key
  const keyBytes = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  
  if (keyBytes.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (256 bits) base64-encoded");
  }

  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a token string
 * Returns a prefixed, base64-encoded ciphertext with IV
 */
export async function encryptToken(plaintext: string): Promise<string> {
  if (!plaintext) {
    return "";
  }

  // Don't re-encrypt already encrypted tokens
  if (plaintext.startsWith(ENCRYPTED_PREFIX)) {
    return plaintext;
  }

  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintextBytes
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as prefixed base64
  const base64 = btoa(String.fromCharCode(...combined));
  return ENCRYPTED_PREFIX + base64;
}

/**
 * Decrypt an encrypted token string
 * Expects the prefixed format from encryptToken
 */
export async function decryptToken(encrypted: string): Promise<string> {
  if (!encrypted) {
    return "";
  }

  // If not encrypted, return as-is (for backward compatibility during migration)
  if (!encrypted.startsWith(ENCRYPTED_PREFIX)) {
    console.warn("Token is not encrypted - returning as plaintext");
    return encrypted;
  }

  const key = await getEncryptionKey();
  const base64 = encrypted.slice(ENCRYPTED_PREFIX.length);
  const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plaintextBytes = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}

/**
 * Check if a token is encrypted
 */
export function isTokenEncrypted(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once to generate a key, then store it in SIGNING_SECRET
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}
