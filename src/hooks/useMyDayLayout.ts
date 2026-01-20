import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { 
  LayoutConfig, 
  getFilteredDefaultLayout,
  getAvailableWidgetsForCustomize,
  getAvailableSections,
  MY_DAY_WIDGETS,
  MY_DAY_SECTIONS,
} from "@/components/myday/myDayWidgets";
import { toast } from "sonner";
import { logMyDayFiltering } from "@/utils/onboardingDebug";

/**
 * My Day Layout Hook
 * 
 * IMPORTANT: This hook now filters widgets based on installed modules.
 * Widgets will only appear if their requiredModuleId is installed in the workspace.
 */
export function useMyDayLayout() {
  const { currentWorkspace, workspaceModules } = useWorkspace();
  const [layout, setLayout] = useState<LayoutConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get installed module IDs for the current workspace
  const installedModuleIds = workspaceModules?.map(wm => wm.module_id) || [];

  // Get the filtered default layout based on installed modules
  const getDefaultLayoutForWorkspace = useCallback(() => {
    return getFilteredDefaultLayout(installedModuleIds);
  }, [installedModuleIds]);

  // Check if workspace has any modules installed
  const hasNoModules = installedModuleIds.length === 0;

  // Get widgets available for customization (filtered by installed modules)
  const availableWidgets = getAvailableWidgetsForCustomize(installedModuleIds);
  const availableSections = getAvailableSections(installedModuleIds);

  // Log filtering state for debugging
  useEffect(() => {
    if (layout) {
      logMyDayFiltering({
        totalWidgets: MY_DAY_WIDGETS.length,
        availableWidgets: availableWidgets.length,
        hiddenWidgets: layout.hiddenWidgets,
        sections: layout.sectionOrder,
      });
    }
  }, [layout, availableWidgets.length]);

  // Load layout from database
  useEffect(() => {
    async function loadLayout() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLayout(getDefaultLayoutForWorkspace());
          return;
        }

        const { data, error } = await supabase
          .from("user_myday_layouts")
          .select("layout_json")
          .eq("user_id", user.id)
          .eq("workspace_id", currentWorkspace?.id ?? null)
          .maybeSingle();

        if (error) {
          console.error("Error loading layout:", error);
          setLayout(getDefaultLayoutForWorkspace());
          return;
        }

        if (data?.layout_json) {
          const savedLayout = data.layout_json as unknown as LayoutConfig;
          
          // Merge saved layout with filtered defaults
          // This ensures new widgets from newly installed modules appear
          const defaultLayout = getDefaultLayoutForWorkspace();
          
          // Filter saved sections/widgets to only include those still available
          const filteredSectionOrder = savedLayout.sectionOrder.filter(
            sectionId => availableSections.some(s => s.id === sectionId)
          );
          
          // Add any new sections from installed modules not in saved order
          const newSections = defaultLayout.sectionOrder.filter(
            sectionId => !filteredSectionOrder.includes(sectionId)
          );
          
          const mergedSectionOrder = [...filteredSectionOrder, ...newSections];
          
          // Merge widget orders
          const mergedWidgetOrder: Record<string, string[]> = {};
          for (const sectionId of mergedSectionOrder) {
            const savedOrder = savedLayout.widgetOrder[sectionId] || [];
            const defaultOrder = defaultLayout.widgetOrder[sectionId] || [];
            
            // Filter saved widgets to only those still available
            const availableWidgetIds = new Set(
              availableWidgets.filter(w => w.section === sectionId).map(w => w.id)
            );
            
            const filteredSavedOrder = savedOrder.filter(id => availableWidgetIds.has(id));
            
            // Add new widgets not in saved order
            const newWidgets = defaultOrder.filter(id => !filteredSavedOrder.includes(id));
            
            mergedWidgetOrder[sectionId] = [...filteredSavedOrder, ...newWidgets];
          }
          
          // Filter hidden widgets to only those still available
          const availableWidgetIds = new Set(availableWidgets.map(w => w.id));
          const filteredHiddenWidgets = (savedLayout.hiddenWidgets || []).filter(
            id => availableWidgetIds.has(id)
          );
          
          setLayout({
            sectionOrder: mergedSectionOrder,
            widgetOrder: mergedWidgetOrder,
            hiddenWidgets: filteredHiddenWidgets,
          });
        } else {
          // No saved layout - use filtered default
          setLayout(getDefaultLayoutForWorkspace());
        }
      } catch (error) {
        console.error("Error loading layout:", error);
        setLayout(getDefaultLayoutForWorkspace());
      } finally {
        setIsLoading(false);
      }
    }

    loadLayout();
  }, [currentWorkspace?.id, getDefaultLayoutForWorkspace, availableSections, availableWidgets]);

  // Save layout to database
  const saveLayout = useCallback(async (newLayout: LayoutConfig) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if layout exists
      const { data: existing } = await supabase
        .from("user_myday_layouts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("user_myday_layouts")
          .update({
            layout_json: JSON.parse(JSON.stringify(newLayout)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_myday_layouts")
          .insert({
            user_id: user.id,
            workspace_id: currentWorkspace?.id,
            layout_json: JSON.parse(JSON.stringify(newLayout)),
          });
        if (insertError) throw insertError;
      }

      setLayout(newLayout);
      toast.success("Layout saved");
    } catch (err) {
      console.error("Error saving layout:", err);
      toast.error("Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkspace?.id]);

  // Update layout optimistically
  const updateLayout = useCallback((newLayout: LayoutConfig) => {
    setLayout(newLayout);
  }, []);

  // Reset to default (filtered by installed modules)
  const resetLayout = useCallback(async () => {
    const defaultLayout = getDefaultLayoutForWorkspace();
    await saveLayout(defaultLayout);
  }, [getDefaultLayoutForWorkspace, saveLayout]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setLayout(prev => {
      if (!prev) return prev;
      const isHidden = prev.hiddenWidgets.includes(widgetId);
      return {
        ...prev,
        hiddenWidgets: isHidden
          ? prev.hiddenWidgets.filter(id => id !== widgetId)
          : [...prev.hiddenWidgets, widgetId],
      };
    });
  }, []);

  // Reorder sections
  const reorderSections = useCallback((newOrder: string[]) => {
    setLayout(prev => prev ? {
      ...prev,
      sectionOrder: newOrder,
    } : prev);
  }, []);

  // Reorder widgets within a section
  const reorderWidgets = useCallback((sectionId: string, newOrder: string[]) => {
    setLayout(prev => prev ? {
      ...prev,
      widgetOrder: {
        ...prev.widgetOrder,
        [sectionId]: newOrder,
      },
    } : prev);
  }, []);

  return {
    layout: layout || getDefaultLayoutForWorkspace(),
    isLoading,
    isSaving,
    saveLayout,
    updateLayout,
    resetLayout,
    toggleWidgetVisibility,
    reorderSections,
    reorderWidgets,
    // New exports for filtering
    installedModuleIds,
    hasNoModules,
    availableWidgets,
    availableSections,
  };
}
