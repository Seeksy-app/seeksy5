// Thin re-export of the canonical Supabase client
// This file exists for backward compatibility with imports from @/lib/supabase

export { supabase } from '@/integrations/supabase/client';
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/client';
