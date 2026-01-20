import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseAutosaveOptions {
  formType: string;
  formId?: string;
  interval?: number; // milliseconds, default 3000
  enabled?: boolean;
}

export function useAutosave<T extends Record<string, unknown>>({
  formType,
  formId,
  interval = 3000,
  enabled = true
}: UseAutosaveOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const previousDataRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load saved draft on mount
  useEffect(() => {
    if (!enabled) return;

    const loadDraft = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: draft } = await supabase
          .from("autosave_drafts")
          .select("draft_data, last_saved_at")
          .eq("user_id", user.id)
          .eq("form_type", formType)
          .eq("form_id", formId || "")
          .single();

        if (draft) {
          setData(draft.draft_data as T);
          setLastSaved(new Date(draft.last_saved_at));
        }
      } catch {
        // No draft found, that's okay
      }
    };

    loadDraft();
  }, [formType, formId, enabled]);

  // Save function
  const save = useCallback(async (newData: T) => {
    if (!enabled) return;

    const dataString = JSON.stringify(newData);
    if (dataString === previousDataRef.current) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing and insert new (workaround for upsert typing)
      await supabase
        .from("autosave_drafts")
        .delete()
        .eq("user_id", user.id)
        .eq("form_type", formType)
        .eq("form_id", formId || "");

      const { error } = await supabase
        .from("autosave_drafts")
        .insert({
          user_id: user.id,
          form_type: formType,
          form_id: formId || "",
          draft_data: JSON.parse(JSON.stringify(newData)),
          last_saved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      previousDataRef.current = dataString;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Autosave failed:", error);
      // Log to system health
      await supabase.from("system_health_log").insert({
        event_type: "write_failure",
        severity: "warning",
        table_name: "autosave_drafts",
        error_message: error instanceof Error ? error.message : "Unknown error",
        error_details: { formType, formId }
      });
    } finally {
      setIsSaving(false);
    }
  }, [formType, formId, enabled]);

  // Update data and trigger autosave
  const updateData = useCallback((newData: T) => {
    setData(newData);
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      save(newData);
    }, interval);
  }, [save, interval]);

  // Clear draft after successful submit
  const clearDraft = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("autosave_drafts")
        .delete()
        .eq("user_id", user.id)
        .eq("form_type", formType)
        .eq("form_id", formId || "");

      setData(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      previousDataRef.current = "";
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  }, [formType, formId]);

  // Warn on navigation if unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    updateData,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    clearDraft,
    forceSave: () => data && save(data)
  };
}

// Hook to show unsaved changes warning
export function useUnsavedChangesWarning(hasChanges: boolean, message?: string) {
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const msg = message || "You have unsaved changes. Are you sure you want to leave?";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, message]);
}