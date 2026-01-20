import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PageBuilderContextType {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  layoutElements: LayoutElement[];
  updateElementPosition: (elementId: string, newOrder: number) => void;
  toggleElementVisibility: (elementId: string) => void;
  saveLayout: () => Promise<void>;
  isLoading: boolean;
}

export interface LayoutElement {
  id: string;
  element_type: string;
  position_order: number;
  is_visible: boolean;
  custom_settings?: Record<string, any>;
}

const PageBuilderContext = createContext<PageBuilderContextType | undefined>(undefined);

export const usePageBuilder = () => {
  const context = useContext(PageBuilderContext);
  if (!context) {
    throw new Error('usePageBuilder must be used within PageBuilderProvider');
  }
  return context;
};

export const PageBuilderProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({
  children,
  userId,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutElements, setLayoutElements] = useState<LayoutElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load layout from database
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('my_page_layouts')
          .select('*')
          .eq('user_id', userId)
          .order('position_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setLayoutElements(data as LayoutElement[]);
        } else {
          // Initialize default layout with all elements hidden except essentials
          const defaultElements: LayoutElement[] = [
            { id: 'streaming', element_type: 'streaming', position_order: 0, is_visible: true },
            { id: 'events', element_type: 'events', position_order: 1, is_visible: false },
            { id: 'meetings', element_type: 'meetings', position_order: 2, is_visible: false },
            { id: 'signup-sheets', element_type: 'signup-sheets', position_order: 3, is_visible: false },
            { id: 'polls', element_type: 'polls', position_order: 4, is_visible: false },
            { id: 'podcasts', element_type: 'podcasts', position_order: 5, is_visible: false },
            { id: 'custom-sections', element_type: 'custom-sections', position_order: 6, is_visible: false },
            { id: 'qr-code', element_type: 'qr-code', position_order: 7, is_visible: false },
          ];
          setLayoutElements(defaultElements);
        }
      } catch (error) {
        console.error('Error loading layout:', error);
        toast({
          title: 'Error loading layout',
          description: 'Could not load your page layout.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [userId, toast]);

  const updateElementPosition = (elementId: string, newOrder: number) => {
    setLayoutElements((prev) => {
      const updated = prev.map((el) =>
        el.id === elementId ? { ...el, position_order: newOrder } : el
      );
      return updated.sort((a, b) => a.position_order - b.position_order);
    });
  };

  const toggleElementVisibility = (elementId: string) => {
    setLayoutElements((prev) =>
      prev.map((el) =>
        el.id === elementId ? { ...el, is_visible: !el.is_visible } : el
      )
    );
  };

  const saveLayout = async () => {
    try {
      // Delete existing layout
      await supabase.from('my_page_layouts').delete().eq('user_id', userId);

      // Insert new layout
      const { error } = await supabase.from('my_page_layouts').insert(
        layoutElements.map((el) => ({
          user_id: userId,
          element_type: el.element_type,
          position_order: el.position_order,
          is_visible: el.is_visible,
          custom_settings: el.custom_settings || {},
        }))
      );

      if (error) throw error;

      toast({
        title: 'Layout saved',
        description: 'Your page layout has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        title: 'Error saving layout',
        description: 'Could not save your page layout.',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageBuilderContext.Provider
      value={{
        isEditMode,
        setIsEditMode,
        layoutElements,
        updateElementPosition,
        toggleElementVisibility,
        saveLayout,
        isLoading,
      }}
    >
      {children}
    </PageBuilderContext.Provider>
  );
};
