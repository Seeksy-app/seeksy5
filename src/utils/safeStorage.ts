/**
 * Safe localStorage utilities that gracefully handle quota exceeded errors
 * and other localStorage failures without breaking the app
 */

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[safeStorage] Failed to save ${key}:`, e);
    // If quota exceeded, try to clear old/large items
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[safeStorage] Storage quota exceeded, attempting cleanup...');
      tryCleanupStorage();
    }
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[safeStorage] Failed to get ${key}:`, e);
    return null;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`[safeStorage] Failed to remove ${key}:`, e);
    return false;
  }
}

/**
 * Attempt to free up storage space by removing large or old cached items
 */
function tryCleanupStorage(): void {
  // List of keys that can be safely cleared to free space
  const expendableKeys = [
    'seeksy-poster-images-v1',
    'seeksy_recents',
    'myday-widgets',
    'dashboard-widgets',
  ];

  for (const key of expendableKeys) {
    try {
      const value = localStorage.getItem(key);
      if (value && value.length > 10000) {
        // Clear items larger than 10KB
        localStorage.removeItem(key);
        console.log(`[safeStorage] Cleared ${key} to free space`);
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.warn('[safeStorage] Failed to parse JSON:', e);
    return fallback;
  }
}

/**
 * Safe stringify and store
 */
export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    const json = JSON.stringify(value);
    return safeSetItem(key, json);
  } catch (e) {
    console.warn(`[safeStorage] Failed to stringify/save ${key}:`, e);
    return false;
  }
}
