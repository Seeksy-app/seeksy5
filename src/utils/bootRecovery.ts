/**
 * Boot recovery utility - clears stale auth/storage data and retries
 */

const RECOVERY_KEY = 'seeksy_boot_recovery_attempted';
const RECOVERY_TIMESTAMP = 'seeksy_boot_recovery_ts';
const RECOVERY_COOLDOWN = 60000; // 1 minute cooldown between recovery attempts

export function shouldAttemptRecovery(): boolean {
  const lastAttempt = localStorage.getItem(RECOVERY_TIMESTAMP);
  if (lastAttempt) {
    const elapsed = Date.now() - parseInt(lastAttempt, 10);
    if (elapsed < RECOVERY_COOLDOWN) {
      console.log('[BootRecovery] Cooldown active, skipping recovery');
      return false;
    }
  }
  return true;
}

export async function clearAuthStorage(): Promise<void> {
  console.log('[BootRecovery] Clearing auth storage...');
  
  // Clear localStorage items related to Supabase auth
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('supabase') ||
      key.includes('sb-') ||
      key.includes('auth-token')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log('[BootRecovery] Removing localStorage key:', key);
    localStorage.removeItem(key);
  });

  // Clear IndexedDB databases related to Supabase
  const dbNames = ['supabase-auth', 'supabase-storage'];
  for (const dbName of dbNames) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          console.log(`[BootRecovery] Deleted IndexedDB: ${dbName}`);
          resolve();
        };
        request.onerror = () => {
          console.warn(`[BootRecovery] Failed to delete IndexedDB: ${dbName}`);
          resolve(); // Continue even if deletion fails
        };
        request.onblocked = () => {
          console.warn(`[BootRecovery] Blocked deleting IndexedDB: ${dbName}`);
          resolve();
        };
      });
    } catch (e) {
      console.warn(`[BootRecovery] Error deleting IndexedDB ${dbName}:`, e);
    }
  }
}

export function markRecoveryAttempted(): void {
  localStorage.setItem(RECOVERY_KEY, 'true');
  localStorage.setItem(RECOVERY_TIMESTAMP, Date.now().toString());
}

export function clearRecoveryFlag(): void {
  localStorage.removeItem(RECOVERY_KEY);
}

export function isRecoveryAttempted(): boolean {
  return localStorage.getItem(RECOVERY_KEY) === 'true';
}

export async function attemptBootRecovery(): Promise<void> {
  if (!shouldAttemptRecovery()) {
    console.log('[BootRecovery] Skipping recovery (cooldown or already attempted)');
    return;
  }
  
  console.log('[BootRecovery] Attempting boot recovery...');
  markRecoveryAttempted();
  
  await clearAuthStorage();
  
  // Reload the page after clearing storage
  console.log('[BootRecovery] Reloading page...');
  window.location.reload();
}

export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.code;
  
  return (
    status === 401 ||
    status === 403 ||
    status === 406 ||
    status === 'PGRST301' ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('auth') ||
    message.includes('session') ||
    message.includes('not authenticated') ||
    message.includes('invalid claim')
  );
}
