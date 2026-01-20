import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCFONotes(pageKey: string) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [pageKey]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('cfo_notes')
        .select('notes')
        .eq('page_key', pageKey)
        .maybeSingle();

      if (error) throw error;
      setNotes(data?.notes || '');
    } catch (error) {
      console.error('Error fetching CFO notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (newNotes: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cfo_notes')
        .upsert({
          page_key: pageKey,
          notes: newNotes,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        }, { onConflict: 'page_key' });

      if (error) throw error;
      setNotes(newNotes);
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving CFO notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return { notes, setNotes, loading, saving, saveNotes };
}
